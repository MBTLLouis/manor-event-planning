import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { MapPin, Calendar, Hotel, Car, Gift, Image as ImageIcon, CheckCircle, Sparkles, Shirt, MapIcon, HelpCircle } from 'lucide-react';
import WebsiteRSVP from '@/components/WebsiteRSVP';

export default function PublicWeddingWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  // Fetch wedding website by slug (public procedure)
  const { data: weddingWebsite, isLoading: websiteLoading } = trpc.weddingWebsite.getBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch event by slug (public procedure)
  const { data: event, isLoading: eventLoading } = trpc.weddingWebsite.getEventBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch timeline items by slug (public procedure)
  const { data: timelineItems = [] } = trpc.weddingWebsite.getTimelineItemsBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch registry links by slug (public procedure)
  const { data: registryLinks = [] } = trpc.weddingWebsite.getRegistryLinksBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch FAQ items by slug (public procedure)
  const { data: faqItems = [] } = trpc.weddingWebsite.getFaqItemsBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch photos by slug (public procedure)
  const { data: photos = [] } = trpc.weddingWebsite.getPhotosBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug, refetchInterval: 30000 } // Refetch every 30 seconds
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
      <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-[#2C5F5D]">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!weddingWebsite || !event || !weddingWebsite.isPublished) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] to-[#E8DCC4] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-[#2C5F5D]">Wedding Not Found</h1>
          <p className="text-[#5A7A78] mt-2">This wedding website is not yet published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFDFB]">
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-br from-[#2C5F5D] via-[#3A7A77] to-[#1a3a38] overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#D4AF37] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl"></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-4">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            <span className="text-[#D4AF37] font-light tracking-widest uppercase text-sm">We're Getting Married</span>
            <Sparkles className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h1 className="text-6xl md:text-7xl font-serif mb-4 text-white drop-shadow-lg">{event.coupleName1} & {event.coupleName2}</h1>
          <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
          <p className="text-2xl font-light tracking-wide text-[#E8DCC4]">{format(new Date(event.eventDate), 'MMMM d, yyyy')}</p>
          <p className="text-lg font-light text-[#E8DCC4] mt-4 max-w-2xl">Join us for an elegant celebration of love</p>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="bg-gradient-to-r from-[#F5F1E8] to-[#E8DCC4] py-16 border-b-2 border-[#D4AF37]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-4xl font-serif text-[#2C5F5D] mb-12">The Countdown Begins</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-[#D4AF37] text-center">
              <div className="text-5xl font-serif text-[#D4AF37] mb-2">{countdown.days}</div>
              <div className="text-sm text-[#5A7A78] uppercase tracking-widest font-light">Days</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-[#D4AF37] text-center">
              <div className="text-5xl font-serif text-[#D4AF37] mb-2">{countdown.hours}</div>
              <div className="text-sm text-[#5A7A78] uppercase tracking-widest font-light">Hours</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-[#D4AF37] text-center">
              <div className="text-5xl font-serif text-[#D4AF37] mb-2">{countdown.minutes}</div>
              <div className="text-sm text-[#5A7A78] uppercase tracking-widest font-light">Minutes</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-[#D4AF37] text-center">
              <div className="text-5xl font-serif text-[#D4AF37] mb-2">0</div>
              <div className="text-sm text-[#5A7A78] uppercase tracking-widest font-light">Seconds</div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Message */}
      {weddingWebsite?.welcomeMessage && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4">Welcome</h2>
              <div className="w-16 h-1 bg-[#D4AF37] mx-auto"></div>
            </div>
            <div className="text-[#5A7A78] text-lg leading-relaxed whitespace-pre-wrap text-center font-light">
              {weddingWebsite.welcomeMessage}
            </div>
          </div>
        </section>
      )}

      {/* RSVP Section - Moved here after welcome */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] border-y-2 border-[#D4AF37]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4">We'd Love Your Company</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto"></div>
            <p className="text-[#5A7A78] mt-4 text-lg font-light">Please confirm your attendance and let us know your meal preferences</p>
          </div>
          {weddingWebsite && event && (
            <WebsiteRSVP
              websiteId={weddingWebsite.id}
              eventId={event.id}
              coupleName1={event.coupleName1 || undefined}
              coupleName2={event.coupleName2 || undefined}
              eventDate={new Date(event.eventDate)}
            />
          )}
        </div>
      </section>

      {/* Our Story */}
      {weddingWebsite?.ourStory && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Our Story</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="text-[#5A7A78] text-lg leading-relaxed whitespace-pre-wrap font-light">
              {weddingWebsite.ourStory}
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {timelineItems && timelineItems.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">The Day's Timeline</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="space-y-8">
              {timelineItems.map((item: any, index: number) => (
                <div key={item.id} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center text-white font-serif text-lg shadow-lg">
                      {index + 1}
                    </div>
                    {index < timelineItems.length - 1 && (
                      <div className="w-1 h-16 bg-[#D4AF37] mt-2"></div>
                    )}
                  </div>
                  <div className="pb-8">
                    <div className="text-2xl font-serif text-[#2C5F5D] mb-2">{item.title}</div>
                    <div className="text-[#D4AF37] font-light mb-3">{item.time}</div>
                    {item.description && (
                      <div className="text-[#5A7A78] font-light leading-relaxed">{item.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Event Details */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Event Details</h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] rounded-lg p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-[#D4AF37]" />
                <h3 className="text-2xl font-serif text-[#2C5F5D]">Venue</h3>
              </div>
              <p className="text-[#5A7A78] font-light leading-relaxed">Manor By The Lake</p>
            </div>
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] rounded-lg p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Hotel className="w-6 h-6 text-[#D4AF37]" />
                <h3 className="text-2xl font-serif text-[#2C5F5D]">Accommodations</h3>
              </div>
              <p className="text-[#5A7A78] font-light leading-relaxed">Guest accommodations available on-site</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dress Code */}
      {weddingWebsite?.dressCode && (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shirt className="w-8 h-8 text-[#2C5F5D]" />
              <h2 className="text-5xl font-serif text-[#2C5F5D]">Dress Code</h2>
            </div>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <p className="text-[#5A7A78] text-lg leading-relaxed font-light whitespace-pre-wrap">{weddingWebsite.dressCode}</p>
            </div>
          </div>
        </section>
      )}

      {/* Travel & Accommodation Info */}
      {weddingWebsite?.travelInfo && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MapIcon className="w-8 h-8 text-[#2C5F5D]" />
              <h2 className="text-5xl font-serif text-[#2C5F5D]">Travel & Accommodations</h2>
            </div>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] rounded-lg p-8 shadow-lg">
              <p className="text-[#5A7A78] text-lg leading-relaxed font-light whitespace-pre-wrap">{weddingWebsite.travelInfo}</p>
            </div>
          </div>
        </section>
      )}

      {/* Registry Links */}
      {registryLinks.length > 0 ? (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Gift Registry</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="grid md:grid-cols-2 gap-6">
              {registryLinks.map((link: any) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Gift className="w-6 h-6 text-[#D4AF37]" />
                    <h3 className="text-xl font-serif text-[#2C5F5D]">{link.title}</h3>
                  </div>
                  <p className="text-[#5A7A78] font-light text-sm truncate">{link.url}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Gift Registry</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <p className="text-[#5A7A78] text-lg text-center font-light">
              Registry links coming soon. We'll share our gift registry details here.
            </p>
          </div>
        </section>
      )}

      {/* Photo Gallery */}
      {photos && photos.length > 0 ? (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Gallery</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo: any) => (
                <div key={photo.id} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || 'Wedding photo'}
                    className="w-full h-64 object-cover"
                  />
                  {photo.caption && (
                    <div className="bg-white p-4">
                      <p className="text-[#5A7A78] font-light text-sm">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Gallery</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <p className="text-[#5A7A78] text-lg text-center font-light">
              Photo gallery coming soon. We'll share our favorite moments from the wedding here.
            </p>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqItems.length > 0 ? (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Frequently Asked Questions</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="space-y-6">
              {faqItems.map((item: any) => (
                <div key={item.id} className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
                    <h3 className="text-lg font-serif text-[#2C5F5D]">{item.question}</h3>
                  </div>
                  <p className="text-[#5A7A78] font-light leading-relaxed ml-9">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Frequently Asked Questions</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <p className="text-[#5A7A78] text-lg text-center font-light">
              FAQ section coming soon. We'll answer common questions here.
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#2C5F5D] to-[#1a3a38] text-white py-12 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-serif mb-2">{event.coupleName1} & {event.coupleName2}</h3>
          <div className="w-12 h-1 bg-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-[#E8DCC4] font-light mb-4">{format(new Date(event.eventDate), 'MMMM d, yyyy')}</p>
          <p className="text-[#D4AF37] font-light">Thank you for celebrating with us</p>
        </div>
      </footer>
    </div>
  );
}
