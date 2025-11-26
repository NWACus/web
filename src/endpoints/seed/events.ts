import { Media, Tenant } from '@/payload-types'
import { US_TIMEZONES } from '@/utilities/timezones'
import { RequiredDataFromCollectionSlug } from 'payload'
import { futureDate, pastDate, simpleContent } from './utilities'

export const getEventsData = (
  tenant: Tenant,
  featuredImage?: Media,
  thumbnailImage?: Media,
): RequiredDataFromCollectionSlug<'events'>[] => {
  return [
    // Awareness event - Free beginner-friendly
    {
      title: 'Introduction to Avalanche Safety',
      subtitle: 'Free community presentation',
      description:
        'Join us for a free avalanche awareness presentation covering the basics of avalanche safety, terrain recognition, and rescue fundamentals. Perfect for anyone new to winter backcountry recreation.',
      startDate: pastDate(1, 15, 19),
      endDate: pastDate(1, 15, 21),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        placeName: 'Mountain Community Center',
        address: '123 Alpine Way',
        city: 'North Bend',
        state: 'WA',
        zip: '98045',
        extraInfo: 'Enter through main entrance, presentation in Room A',
      },
      featuredImage: featuredImage?.id,
      thumbnailImage: thumbnailImage?.id,
      registrationUrl: 'https://example.com/register/awareness-intro',
      skillRating: 'beginner',
      type: 'awareness',
      modeOfTravel: ['ski', 'splitboard', 'motorized', 'snowshoe'],
      tenant: tenant.id,
      slug: 'introduction-to-avalanche-safety',
      _status: 'published',
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
        placeName: 'Backcountry Lodge',
        address: '456 Summit Ridge Rd',
        city: 'Stevens Pass',
        state: 'WA',
        zip: '98826',
        extraInfo: 'Meet at the lodge, dress for field work',
      },
      featuredImage: featuredImage?.id,
      thumbnailImage: thumbnailImage?.id,
      registrationUrl: 'https://example.com/register/snowpack-workshop',
      registrationDeadline: futureDate(2, 1, 23),
      skillRating: 'professional',
      type: 'workshop',
      modeOfTravel: ['ski'],
      tenant: tenant.id,
      slug: 'advanced-snowpack-analysis-workshop',
      _status: 'published',
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
      startDate: futureDate(1, 5, 8),
      endDate: futureDate(1, 5, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        placeName: 'Mountain View Snowpark',
        address: 'Forest Road 2510',
        city: 'Greenwater',
        state: 'WA',
        zip: '98022',
        extraInfo: 'Meet in the main parking area, bring your sled',
      },
      featuredImage: featuredImage?.id,
      thumbnailImage: thumbnailImage?.id,
      registrationUrl: 'https://example.com/register/snowmobile-safety',
      registrationDeadline: futureDate(1, 1, 23),
      skillRating: 'pre-req',
      type: 'field-class',
      modeOfTravel: ['motorized'],
      tenant: tenant.id,
      slug: 'avalanche-safety-for-snowmobilers',
      _status: 'published',
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
      thumbnailImage: thumbnailImage?.id,
      registrationUrl: 'https://example.com/register/virtual-awareness',
      skillRating: 'beginner',
      type: 'awareness',
      modeOfTravel: ['ski', 'splitboard', 'motorized', 'snowshoe'],
      tenant: tenant.id,
      slug: 'virtual-avalanche-awareness-webinar',
      _status: 'published',
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
        placeName: 'Local Brewery Taproom',
        address: '789 Main Street',
        city: 'North Bend',
        state: 'WA',
        zip: '98045',
        extraInfo: 'All ages welcome, food and beverages available for purchase',
      },
      featuredImage: featuredImage?.id,
      thumbnailImage: thumbnailImage?.id,
      registrationUrl: 'https://example.com/register/meet-forecasters',
      skillRating: 'beginner',
      type: 'events-by-ac',
      modeOfTravel: ['ski', 'splitboard', 'motorized', 'snowshoe'],
      tenant: tenant.id,
      slug: 'meet-your-forecasters',
      _status: 'published',
      content: simpleContent(
        'Join us for a casual evening to meet the forecast team and learn about the work that goes into keeping backcountry travelers informed and safe.',
        'What to Expect: Our forecasters will give a short presentation about their daily routine, the tools they use, and some of the challenging decisions they face. After the presentation, stick around to chat, ask questions, and connect with other backcountry enthusiasts in the community.',
        'This is a free, family-friendly event. No registration required, but RSVPs are appreciated for headcount.',
      ),
    },

    // Additional Field Class by AC
    {
      title: "Women's Avalanche Field Day",
      subtitle: 'Empowering women in the backcountry',
      description:
        'A supportive field day for women to practice avalanche skills, build confidence, and connect with other female backcountry enthusiasts.',
      startDate: futureDate(2, 22, 9),
      endDate: futureDate(2, 22, 16),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        placeName: 'Commonwealth Basin Trailhead',
        address: 'Interstate 90, Exit 52',
        city: 'Snoqualmie Pass',
        state: 'WA',
        zip: '98068',
        extraInfo: 'Meet at the Commonwealth Basin parking area',
      },
      featuredImage: featuredImage?.id,
      thumbnailImage: thumbnailImage?.id,
      registrationUrl: 'https://example.com/register/womens-field-day',
      registrationDeadline: futureDate(2, 15, 23),
      skillRating: 'pre-req',
      type: 'field-class',
      modeOfTravel: ['ski'],
      tenant: tenant.id,
      slug: 'womens-avalanche-field-day',
      _status: 'published',
      content: simpleContent(
        'This field day is designed to provide a supportive environment for women to practice and refine their avalanche safety skills.',
        "What We'll Cover: Rescue practice, snowpack observation and testing, terrain assessment, and group decision-making. The focus is on building confidence through hands-on practice in a collaborative setting.",
        'Requirements: Previous avalanche education (awareness session or Level 1 course) and basic backcountry ski/splitboard skills. All participants must have beacon, shovel, and probe.',
        'This event is taught by experienced female educators from our forecast team.',
      ),
    },

    // Volunteer opportunity
    {
      title: 'Backcountry Observer Training',
      subtitle: 'Join our observation network',
      description:
        'Learn how to submit valuable avalanche and snowpack observations to help forecasters keep the community safe. Training includes field observation techniques.',
      startDate: futureDate(1, 25, 9),
      endDate: futureDate(1, 25, 15),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        placeName: 'Stevens Pass Nordic Center',
        address: 'US Highway 2',
        city: 'Skykomish',
        state: 'WA',
        zip: '98288',
        extraInfo: 'Meet at the Nordic Center lodge',
      },
      featuredImage: featuredImage?.id,
      thumbnailImage: thumbnailImage?.id,
      registrationUrl: 'https://example.com/register/observer-training',
      registrationDeadline: futureDate(1, 18, 23),
      skillRating: 'pre-req',
      type: 'volunteer',
      modeOfTravel: ['ski'],
      tenant: tenant.id,
      slug: 'backcountry-observer-training',
      _status: 'published',
      content: simpleContent(
        'Become part of our community observation network! This training will teach you how to collect and submit high-quality avalanche observations.',
        'Training Topics: What forecasters need to know, how to conduct basic snowpack tests, photo guidelines, observation submission through our website, and field safety considerations.',
        'Requirements: Participants should be comfortable traveling in the backcountry and have completed at least an avalanche awareness session. Bring your own touring equipment and avalanche safety gear.',
        'Your observations make a difference! Community data is essential for accurate avalanche forecasting.',
      ),
    },
  ]
}
