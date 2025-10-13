import { EventSubType, EventType, Media, Tenant } from '@/payload-types'
import { US_TIMEZONES } from '@/utilities/timezones'
import { RequiredDataFromCollectionSlug } from 'payload'

export const getEventsData = (
  tenant: Tenant,
  eventTypes: Record<string, EventType>,
  eventSubTypes: Record<string, EventSubType>,
  featuredImage?: Media,
): RequiredDataFromCollectionSlug<'events'>[] => {
  // Helper to create dates in the future
  const futureDate = (monthOffset: number, day: number, hour: number = 18) => {
    const date = new Date()
    date.setMonth(date.getMonth() + monthOffset)
    date.setDate(day)
    date.setHours(hour, 0, 0, 0)
    return date.toISOString()
  }

  // Helper to create properly formatted lexical text nodes
  const textNode = (text: string) => ({
    type: 'text',
    detail: 0,
    format: 0,
    mode: 'normal' as const,
    style: '',
    text,
    version: 1,
  })

  // Helper to create properly formatted lexical paragraph nodes
  const paragraphNode = (text: string) => ({
    type: 'paragraph',
    children: [textNode(text)],
    direction: 'ltr' as const,
    format: '' as '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify',
    indent: 0,
    textFormat: 0,
    version: 1,
  })

  // Helper to create simple content with just paragraphs
  const simpleContent = (...paragraphs: string[]) => ({
    root: {
      type: 'root',
      children: paragraphs.map(paragraphNode),
      direction: 'ltr' as const,
      format: '' as '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify',
      indent: 0,
      version: 1,
    },
  })

  return [
    // Awareness event - Free beginner-friendly
    {
      title: 'Introduction to Avalanche Safety',
      subtitle: 'Free community presentation',
      description:
        'Join us for a free avalanche awareness presentation covering the basics of avalanche safety, terrain recognition, and rescue fundamentals. Perfect for anyone new to winter backcountry recreation.',
      startDate: futureDate(1, 15, 19),
      endDate: futureDate(1, 15, 21),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Mountain Community Center',
        address: '123 Alpine Way',
        city: 'North Bend',
        state: 'WA',
        zip: '98045',
        extraInfo: 'Enter through main entrance, presentation in Room A',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/awareness-intro',
      capacity: 75,
      cost: 0,
      skillRating: '0',
      eventType: eventTypes['awareness'].id,
      tenant: tenant.id,
      slug: 'introduction-to-avalanche-safety',
      content: simpleContent(
        'Learn the basics of avalanche safety in this free community presentation. Topics include: understanding avalanche terrain, reading avalanche forecasts, essential rescue equipment, and trip planning basics.',
        'No previous experience necessary. This event is open to all.',
      ),
    },

    // Workshop event
    {
      title: 'Advanced Snowpack Analysis Workshop',
      subtitle: 'Deep dive into snow science',
      description:
        'A technical workshop focused on advanced snowpack assessment techniques, including extended column tests, profile interpretation, and weak layer identification.',
      startDate: futureDate(2, 8, 9),
      endDate: futureDate(2, 8, 16),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Backcountry Lodge',
        address: '456 Summit Ridge Rd',
        city: 'Stevens Pass',
        state: 'WA',
        zip: '98826',
        extraInfo: 'Meet at the lodge, dress for field work',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/snowpack-workshop',
      registrationDeadline: futureDate(1, 25, 23),
      capacity: 12,
      cost: 150,
      skillRating: '2',
      eventType: eventTypes['workshop'].id,
      tenant: tenant.id,
      slug: 'advanced-snowpack-analysis-workshop',
      content: simpleContent(
        'This intensive one-day workshop is designed for experienced backcountry travelers who want to deepen their understanding of snowpack analysis.',
        'Prerequisites: Participants should have completed a recreational avalanche course and have experience conducting basic stability tests in the field.',
        'What to Bring: Full avalanche safety gear (beacon, shovel, probe), backcountry ski or splitboard setup, lunch and water, notebook and pen.',
      ),
    },

    // Field Class - Snowmobile
    {
      title: 'Avalanche Safety for Snowmobilers',
      subtitle: 'Hands-on training for sled riders',
      description:
        'A comprehensive field course designed specifically for snowmobile riders. Learn avalanche safety, rescue techniques, and safe riding practices in avalanche terrain.',
      startDate: futureDate(1, 22, 8),
      endDate: futureDate(1, 22, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Mountain View Snowpark',
        address: 'Forest Road 2510',
        city: 'Greenwater',
        state: 'WA',
        zip: '98022',
        extraInfo: 'Meet in the main parking area, bring your sled',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/snowmobile-safety',
      registrationDeadline: futureDate(1, 15, 23),
      capacity: 16,
      cost: 200,
      skillRating: '1',
      eventType: eventTypes['field-class-by-ac'].id,
      eventSubType: eventSubTypes['snowmobile-classes'].id,
      tenant: tenant.id,
      slug: 'avalanche-safety-for-snowmobilers',
      content: simpleContent(
        'This full-day field course covers everything snowmobile riders need to know about avalanche safety.',
        'Course Topics: Avalanche terrain identification and avoidance, reading and using avalanche forecasts, companion rescue with snowmobiles, safe riding techniques in avalanche terrain, and decision-making frameworks.',
        'Requirements: Participants must have their own snowmobile, avalanche beacon, shovel, and probe. Previous avalanche education is helpful but not required.',
      ),
    },

    // Virtual awareness event
    {
      title: 'Virtual Avalanche Awareness Webinar',
      subtitle: 'Online introduction to avalanche safety',
      description:
        'Join us online for an interactive webinar introducing avalanche safety fundamentals. Perfect for those planning their first backcountry trips or wanting a refresher.',
      startDate: futureDate(0, 20, 18),
      endDate: futureDate(0, 20, 20),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: true,
        virtualUrl: 'https://zoom.us/j/example-meeting-id',
        extraInfo: 'Zoom link will be sent upon registration',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/virtual-awareness',
      capacity: 100,
      cost: 0,
      skillRating: '0',
      eventType: eventTypes['awareness'].id,
      tenant: tenant.id,
      slug: 'virtual-avalanche-awareness-webinar',
      content: simpleContent(
        'Join us from the comfort of your home for this free avalanche awareness presentation. This interactive webinar covers the essentials of avalanche safety.',
        'What We Will Cover: How avalanches form and release, terrain selection and avoidance strategies, essential rescue equipment, and how to use avalanche forecasts.',
        'Questions are encouraged! Time will be reserved for Q&A at the end.',
      ),
    },

    // Community event with external link
    {
      title: 'Meet Your Forecasters',
      subtitle: 'An evening with the forecast team',
      description:
        'Come meet the forecasters who keep you safe in the backcountry. Learn about the forecasting process, ask questions, and connect with your local avalanche center.',
      startDate: futureDate(0, 28, 18),
      endDate: futureDate(0, 28, 20),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Local Brewery Taproom',
        address: '789 Main Street',
        city: 'North Bend',
        state: 'WA',
        zip: '98045',
        extraInfo: 'All ages welcome, food and beverages available for purchase',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/meet-forecasters',
      capacity: 50,
      cost: 0,
      skillRating: '0',
      eventType: eventTypes['events-by-ac'].id,
      tenant: tenant.id,
      slug: 'meet-your-forecasters',
      content: simpleContent(
        'Join us for a casual evening to meet the forecast team and learn about the work that goes into keeping backcountry travelers informed and safe.',
        'What to Expect: Our forecasters will give a short presentation about their daily routine, the tools they use, and some of the challenging decisions they face. After the presentation, stick around to chat, ask questions, and connect with other backcountry enthusiasts in the community.',
        'This is a free, family-friendly event. No registration required, but RSVPs are appreciated for headcount.',
      ),
    },
  ]
}
