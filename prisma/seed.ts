/**
 * Seed local DB with listings from Keller Williams Graph API.
 * Requires: DATABASE_URL in .env
 * Optional: KW_GRAPH_URL (default: https://graph.prod.consumer.kw.com/)
 * Optional: SEED_LISTING_LIMIT (default: 50 per request)
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const KW_GRAPH_URL =
  process.env.KW_GRAPH_URL ?? 'https://graph.prod.consumer.kw.com/';

const LISTING_SEARCH_QUERY = `query ListingSearch($location: Location!, $filters: SearchFilters, $sorting: Sorting, $first: Float, $after: Float) {
  listings(location: $location, filters: $filters, sorting: $sorting, first: $first, after: $after) {
    listings {
      id
      description
      pricing {
        sale { amount currency }
        rent { amount currency }
        sold { amount currency }
      }
      address {
        displayAddress
        streetName
        streetNo
        zipcode
        city
        state
        unitNo
        country
        primaryAddress
        secondaryAddress
      }
      facets {
        bedrooms
        bathrooms
        homeSize { value unitType }
        lotSize { value unitType }
      }
      listingCategory
      propertyType
      mlsId
      mlsNumber
      urlPath
      listingStatus
    }
    totalCount
  }
}`;

const DEFAULT_VARIABLES = {
  location: {
    boundaryIds: [],
    viewport: {
      bounds: [
        39.648455779031224, -104.86665350769043, 39.55573918872959,
        -104.93205649230957,
      ],
    },
  },
  filters: {
    listingCategory: ['sale'],
    listingStatus: ['active', 'comingSoon'],
    brandedSiteOrgId: 1677967,
    hideVowListings: false,
  },
  sorting: {
    sortBy: 'listingUpdateDate',
    sortDirection: 'desc',
  },
  first: 50,
  after: 0,
};

type KwListing = {
  id: string;
  description: string | null;
  pricing: {
    sale: { amount: number | null; currency: string };
    rent: { amount: number | null; currency: string };
    sold: { amount: number | null; currency: string };
  };
  address: {
    displayAddress: string;
    streetName: string;
    streetNo: string;
    zipcode: string;
    city: string;
    state: string;
    unitNo: string | null;
    country: string;
    primaryAddress: string;
    secondaryAddress: string;
  };
  facets: {
    bedrooms: number | null;
    bathrooms: number | null;
    homeSize: { value: number; unitType: string } | null;
    lotSize: { value: number; unitType: string } | null;
  };
  listingCategory: string;
  propertyType: string;
  mlsId: string;
  mlsNumber: string;
  urlPath: string;
  listingStatus: string;
};

type KwResponse = {
  data?: {
    listings: {
      listings: KwListing[];
      totalCount: number;
    };
  };
  errors?: Array<{ message: string }>;
};

async function fetchKwListings(after: number = 0): Promise<KwResponse> {
  const res = await fetch(KW_GRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: null,
      variables: { ...DEFAULT_VARIABLES, after },
      query: LISTING_SEARCH_QUERY,
    }),
  });

  if (!res.ok) {
    throw new Error(`KW API HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as KwResponse;
  if (json.errors?.length) {
    throw new Error(`KW API errors: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

function kwListingToRecord(
  kw: KwListing,
  realtorId: string
): {
  realtorId: string;
  price: number;
  beds: number;
  baths: number;
  address: string;
  description: string | null;
} {
  const saleAmount = kw.pricing?.sale?.amount ?? kw.pricing?.rent?.amount ?? 0;
  const beds = kw.facets?.bedrooms ?? 0;
  const baths = kw.facets?.bathrooms ?? 0;
  const address = kw.address?.displayAddress ?? 'Address not provided';

  return {
    realtorId,
    price: saleAmount,
    beds,
    baths,
    address,
    description: kw.description ?? null,
  };
}

const prisma = new PrismaClient();

const SEED_REALTOR_EMAIL = 'seed@listing-os.local';
const SEED_REALTOR_NAME = 'KW Seed (listing-os)';

async function main() {
  console.log('Fetching listings from KW Graph API...');
  const response = await fetchKwListings(0);
  const listings = response.data?.listings?.listings ?? [];

  if (listings.length === 0) {
    console.log('No listings returned from API. Exiting.');
    return;
  }

  console.log(`Got ${listings.length} listings (totalCount: ${response.data?.listings?.totalCount ?? '?'}).`);

  let realtor = await prisma.realtor.findUnique({
    where: { email: SEED_REALTOR_EMAIL },
  });

  if (!realtor) {
    realtor = await prisma.realtor.create({
      data: {
        name: SEED_REALTOR_NAME,
        email: SEED_REALTOR_EMAIL,
      },
    });
    console.log(`Created seed realtor: ${realtor.id}`);
  } else {
    const deleted = await prisma.listing.deleteMany({
      where: { realtorId: realtor.id },
    });
    if (deleted.count > 0) {
      console.log(`Cleared ${deleted.count} existing seed listings.`);
    }
  }

  const records = listings.map((kw) =>
    kwListingToRecord(kw, realtor!.id)
  ).filter((r) => r.price > 0 && r.address !== 'Address not provided');

  if (records.length === 0) {
    console.log('No valid records to insert (need price and address).');
    return;
  }

  await prisma.listing.createMany({
    data: records.map((r) => ({
      realtorId: r.realtorId,
      price: r.price,
      beds: r.beds,
      baths: r.baths,
      address: r.address,
      description: r.description,
    })),
    skipDuplicates: false,
  });

  console.log(`Seeded ${records.length} listings for realtor ${realtor.id}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
