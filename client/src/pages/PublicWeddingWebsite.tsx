import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Heart, MapPin, Users, Gift, Calendar, HelpCircle, Shirt, MapIcon } from 'lucide-react';

export default function PublicWeddingWebsite() {
  const [route, params] = useRoute('/wedding/:slug');
  const slug = params?.slug;

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch wedding website by slug (public procedure)
  const { data: weddingWebsite } = trpc.weddingWebsite.getBySlug.useQuery(
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

  // Fetch event details
  const { data: event } = trpc.weddingWebsite.getEventBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Update countdown timer
  useEffect(() => {
    if (!event) return;

    const updateCountdown = () => {
      const eventDate = new Date(event.eventDate).getTime();
      const now = new Date().getTime();
      const difference = eventDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const [guestName, setGuestName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);

  // Handle guest search
  const handleSearch = () => {
    // Placeholder - search functionality would be implemented here
  };

  // Handle RSVP submission
  const handleRsvpSubmit = () => {
    alert('RSVP submitted successfully!');
    setSelectedGuest(null);
    setGuestName('');
    setSearchResults([]);
  };

  if (!route || !weddingWebsite || !event) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-[#2C5F5D] to-[#1a3a38] flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-2xl">
          <div className="text-[#D4AF37] text-lg tracking-widest mb-6 font-light">
            ✦ WE'RE GETTING MARRIED ✦
          </div>
          <h1 className="text-6xl md:text-7xl font-serif text-white mb-4 leading-tight">
            {event.coupleName1} & {event.coupleName2}
          </h1>
          <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-8"></div>
          <p className="text-2xl text-[#E8DCC4] mb-4 font-light">
            {new Date(event.eventDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-lg text-[#D4AF37] font-light">{weddingWebsite.welcomeMessage}</p>
        </div>
      </section>

      {/* Countdown Timer */}
      <section className="py-20 px-4 bg-[#F5F1E8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif text-[#2C5F5D] mb-12 text-center">The Countdown Begins</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-lg p-6 shadow-lg text-center border-t-4 border-[#D4AF37]">
                <div className="text-4xl font-serif text-[#D4AF37] mb-2">{item.value}</div>
                <div className="text-sm text-[#5A7A78] uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4">Welcome</h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-8"></div>
          <p className="text-lg text-[#5A7A78] font-light leading-relaxed">{weddingWebsite.welcomeMessage}</p>
        </div>
      </section>

      {/* RSVP Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">We'd Love Your Company</h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
          <p className="text-center text-[#5A7A78] mb-12 font-light">
            Please confirm your attendance and let us know your meal preferences
          </p>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-serif text-[#2C5F5D] mb-6">
              {event.coupleName1} & {event.coupleName2} RSVP
            </h3>

            {!selectedGuest ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C5F5D] mb-2">
                    Find your name to confirm your attendance
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Enter the name as it appears on your invitation"
                      className="flex-1 px-4 py-2 border border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C5F5D]"
                    />
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 bg-[#2C5F5D] text-white rounded-lg hover:bg-[#1a3a38] transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-[#2C5F5D] mb-3">
                      Select your name:
                    </label>
                    <div className="space-y-2">
                      {searchResults.map((guest) => (
                        <button
                          key={guest.id}
                          onClick={() => setSelectedGuest(guest)}
                          className="w-full text-left px-4 py-3 border border-[#D4AF37] rounded-lg hover:bg-[#F5F1E8] transition-colors"
                        >
                          {guest.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[#2C5F5D] font-medium mb-4">Guest: {selectedGuest.name}</p>
                  <label className="block text-sm font-medium text-[#2C5F5D] mb-2">Meal Preference</label>
                  <select
                    defaultValue={selectedGuest.mealPreference || ''}
                    onChange={(e) => setSelectedGuest({ ...selectedGuest, mealPreference: e.target.value })}
                    className="w-full px-4 py-2 border border-[#D4AF37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C5F5D]"
                  >
                    <option value="">Select a meal preference</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Meat">Meat</option>
                    <option value="Fish">Fish</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRsvpSubmit}
                    className="flex-1 px-4 py-2 bg-[#2C5F5D] text-white rounded-lg hover:bg-[#1a3a38] transition-colors"
                  >
                    Confirm Attendance
                  </button>
                  <button
                    onClick={() => setSelectedGuest(null)}
                    className="flex-1 px-4 py-2 border border-[#D4AF37] text-[#2C5F5D] rounded-lg hover:bg-[#F5F1E8] transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4">Our Story</h2>
          <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-8"></div>
          <p className="text-lg text-[#5A7A78] font-light leading-relaxed">{weddingWebsite.ourStory}</p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-serif text-[#2C5F5D] mb-12 text-center">The Day's Timeline</h2>
          <div className="space-y-8">
            {timelineItems.map((item: any, index: number) => (
              <div key={item.id} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#2C5F5D] flex items-center justify-center font-serif text-lg font-bold">
                    {index + 1}
                  </div>
                  {index < timelineItems.length - 1 && (
                    <div className="w-1 h-16 bg-[#D4AF37] mt-4"></div>
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-2xl font-serif text-[#2C5F5D] mb-2">{item.title}</h3>
                  <p className="text-[#D4AF37] font-light mb-2">{item.time}</p>
                  <p className="text-[#5A7A78] font-light">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-serif text-[#2C5F5D] mb-12 text-center">Event Details</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-[#2C5F5D]" />
                <h3 className="text-2xl font-serif text-[#2C5F5D]">Venue</h3>
              </div>
              <p className="text-[#5A7A78] font-light">{event.title}</p>
            </div>
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] rounded-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-[#2C5F5D]" />
                <h3 className="text-2xl font-serif text-[#2C5F5D]">Accommodations</h3>
              </div>
              <p className="text-[#5A7A78] font-light">Guest accommodations available on-site</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dress Code Section */}
      {weddingWebsite.dressCode && (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center flex items-center justify-center gap-3">
              <Shirt className="w-8 h-8" />
              Dress Code
            </h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-8"></div>
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <p className="text-[#5A7A78] font-light text-center text-lg">{weddingWebsite.dressCode}</p>
            </div>
          </div>
        </section>
      )}

      {/* Travel & Accommodations Section */}
      {weddingWebsite.travelInfo && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center flex items-center justify-center gap-3">
              <MapIcon className="w-8 h-8" />
              Travel & Accommodations
            </h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-8"></div>
            <div className="bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4] rounded-lg p-8">
              <p className="text-[#5A7A78] font-light text-lg">{weddingWebsite.travelInfo}</p>
            </div>
          </div>
        </section>
      )}

      {/* Gift Registry Section */}
      {registryLinks.length > 0 ? (
        <section className="py-20 px-4 bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC4]">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-4 text-center">Gift Registry</h2>
            <div className="w-16 h-1 bg-[#D4AF37] mx-auto mb-12"></div>
            <div className="grid md:grid-cols-2 gap-6">
              {registryLinks.map((link: any) => {
                // Ensure URL has protocol
                const url = link.url.startsWith('http://') || link.url.startsWith('https://') 
                  ? link.url 
                  : `https://${link.url}`;
                return (
                  <a
                    key={link.id}
                    href={url}
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
                );
              })}
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
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-12 text-center">Frequently Asked Questions</h2>
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
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-serif text-[#2C5F5D] mb-12 text-center">Frequently Asked Questions</h2>
            <p className="text-[#5A7A78] text-lg text-center font-light">
              FAQ section coming soon. We'll answer common questions here.
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#2C5F5D] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-serif mb-2">
            {event.coupleName1} & {event.coupleName2}
          </h3>
          <p className="text-[#D4AF37] font-light">
            {new Date(event.eventDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </footer>
    </div>
  );
}
