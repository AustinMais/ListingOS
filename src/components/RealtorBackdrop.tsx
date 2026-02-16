'use client';

import Image from 'next/image';
import Link from 'next/link';

const BOOK_DEMO_URL = process.env.NEXT_PUBLIC_BOOK_DEMO_URL ?? 'https://calendly.com';

/** Fake featured listings for the backdrop — Douglas County, CO area. */
const FEATURED_LISTINGS = [
  {
    address: '4285 Copper Canyon Dr',
    city: 'Castle Rock',
    price: '$1,895,000',
    beds: 5,
    baths: 5,
    sqft: '5,234',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  },
  {
    address: '7201 Plum Creek Pkwy',
    city: 'Castle Rock',
    price: '$749,000',
    beds: 4,
    baths: 3,
    sqft: '2,890',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  },
  {
    address: '1842 Parkside Dr',
    city: 'Highlands Ranch',
    price: '$625,000',
    beds: 4,
    baths: 4,
    sqft: '3,156',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  },
];

export default function RealtorBackdrop() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 py-3 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-gray-900">ListingOS Demo</span>
          <div className="hidden md:flex gap-6 text-sm text-gray-600">
            <span className="cursor-default hover:text-gray-900">Buy</span>
            <span className="cursor-default hover:text-gray-900">Sell</span>
            <span className="cursor-default hover:text-gray-900">Find an Agent</span>
          </div>
        </div>
        <Link
          href={BOOK_DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#CE011F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a00119] transition-colors"
        >
          Book a Demo
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative h-[320px] md:h-[400px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
            Let&apos;s find your dream home
          </h1>
          <p className="mt-2 text-lg text-white/90 max-w-xl">
            Douglas County &mdash; Castle Rock, Highlands Ranch, Lone Tree & more
          </p>
          <div className="mt-6 flex gap-3 text-sm">
            <span className="rounded-full bg-white/20 backdrop-blur px-4 py-2 text-white">
              Buy
            </span>
            <span className="rounded-full bg-white/20 backdrop-blur px-4 py-2 text-white">
              Sell
            </span>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Listings</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_LISTINGS.map((listing, i) => (
            <div
              key={i}
              className="group rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={listing.image}
                  alt={`${listing.address}, ${listing.city}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <p className="text-lg font-semibold text-[#CE011F]">{listing.price}</p>
                <p className="text-gray-900 font-medium">{listing.address}</p>
                <p className="text-sm text-gray-500">{listing.city}, CO</p>
                <p className="mt-2 text-sm text-gray-600">
                  {listing.beds} bed &middot; {listing.baths} bath &middot; {listing.sqft} sq ft
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / CTA strip */}
      <section className="bg-[#CE011F] py-10 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <p className="text-lg font-medium">
            Top-producing Keller Williams team serving Douglas County
          </p>
          <p className="mt-1 text-white/90 text-sm">
            Schedule a free consultation &mdash; no obligation
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-white">Keller Williams Realty</span>
          <p className="text-sm">
            Douglas County, CO &middot; Castle Rock &middot; Highlands Ranch &middot; Parker
          </p>
        </div>
      </footer>
    </div>
  );
}
