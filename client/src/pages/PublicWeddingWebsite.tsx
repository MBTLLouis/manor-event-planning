import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { MapPin, Calendar, Hotel, Car, Gift, Image as ImageIcon } from 'lucide-react';

export default function PublicWeddingWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  // Fetch wedding website by slug (public procedure)
  const { data: weddingWebsite, isLoading: websiteLoading } = trpc.weddingWebsite.getBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug }
  );

  // Fetch event by slug (public procedure)
  const { data: event, isLoading: eventLoading } = trpc.weddingWebsite.getEventBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug }
  );

  // Update countdown timer
  useEffect(() => {
    if (!event) return;

    const updateCountdown = () => {
      const now = new Date();
      const eventDate = new Date(event.eventDate);
      
      const days = differenceInDays(eventDate, now);
      const hours = differenceInHours(eventDate, now) % 24;
      const minutes = differenceInMinutes(eventDate, now) % 60;

      setCountdown({ days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [event]);

  if (websiteLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-slate-800">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!weddingWebsite || !event || !weddingWebsite.isPublished) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-slate-800">Wedding Not Found</h1>
          <p className="text-slate-600 mt-2">This wedding website is not yet published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Banner */}
      <section className="relative h-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4">
          <h1 className="text-5xl font-serif mb-2">{event.coupleName1} & {event.coupleName2}</h1>
          <p className="text-xl font-light tracking-wide">{format(new Date(event.eventDate), 'MMMM d, yyyy')}</p>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="bg-gradient-to-r from-slate-100 to-slate-50 py-12 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-center text-3xl font-serif text-slate-800 mb-8">Days Until Our Wedding</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="text-4xl font-serif text-slate-800">{countdown.days}</div>
              <div className="text-sm text-slate-600 mt-2">Days</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="text-4xl font-serif text-slate-800">{countdown.hours}</div>
              <div className="text-sm text-slate-600 mt-2">Hours</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="text-4xl font-serif text-slate-800">{countdown.minutes}</div>
              <div className="text-sm text-slate-600 mt-2">Minutes</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <div className="text-4xl font-serif text-slate-800">0</div>
              <div className="text-sm text-slate-600 mt-2">Seconds</div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Message */}
      {weddingWebsite?.welcomeMessage && (
        <section className="py-16 px-4 max-w-4xl mx-auto">
          <div className="prose prose-slate max-w-none">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-slate-800">Welcome</h2>
            </div>
            <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
              {weddingWebsite.welcomeMessage}
            </div>
          </div>
        </section>
      )}

      {/* Our Story */}
      {weddingWebsite?.ourStory && (
        <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif text-slate-800 mb-8 text-center">Our Story</h2>
            <div className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
              {weddingWebsite.ourStory}
            </div>
          </div>
        </section>
      )}

      {/* Event Details */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-serif text-slate-800 mb-12 text-center">Event Details</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <Calendar className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-lg text-slate-800 mb-2">Date & Time</h3>
              <p className="text-slate-600">{format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}</p>
              <p className="text-slate-600">Time to be confirmed</p>
            </div>
          </div>
          <div className="flex gap-4">
            <MapPin className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-lg text-slate-800 mb-2">Location</h3>
              <p className="text-slate-600">Venue details to be confirmed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodation */}
      <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 items-start mb-8">
            <Hotel className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-serif text-slate-800 mb-4">Accommodation</h2>
              <p className="text-slate-700 leading-relaxed">
                We have arranged special rates at several nearby hotels. More details coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Travel & Parking */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="flex gap-4 items-start">
          <Car className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-3xl font-serif text-slate-800 mb-4">Travel & Parking</h2>
            <p className="text-slate-700 leading-relaxed">
              Parking is available at the venue. For guests traveling from out of town, we recommend arriving the day before.
            </p>
          </div>
        </div>
      </section>

      {/* Gift Registry */}
      {weddingWebsite?.registryLinks && (
        <section className="py-16 px-4 bg-slate-50 border-y border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-start">
              <Gift className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-3xl font-serif text-slate-800 mb-4">Gift Registry</h2>
                <p className="text-slate-700 mb-4">
                  Your presence is the greatest gift, but if you wish to give us something, you can find our registries below:
                </p>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const links = JSON.parse(weddingWebsite.registryLinks);
                      return Array.isArray(links) ? links.map((link: any, idx: number) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-slate-600 hover:text-slate-800 underline"
                        >
                          {link.name}
                        </a>
                      )) : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Photo Gallery */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="flex gap-4 items-start">
          <ImageIcon className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-3xl font-serif text-slate-800 mb-4">Gallery</h2>
            <p className="text-slate-700">
              Photo gallery coming soon. We'll share our favorite moments from the wedding here.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16 text-center">
        <p className="text-slate-400">Thank you for celebrating with us</p>
      </footer>
    </div>
  );
}
