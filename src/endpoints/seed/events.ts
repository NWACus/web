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
      modeOfTravel: 'any',
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
      modeOfTravel: 'ski',
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
      modeOfTravel: 'motorized',
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
      modeOfTravel: 'any',
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
      modeOfTravel: 'any',
      tenant: tenant.id,
      slug: 'meet-your-forecasters',
      content: simpleContent(
        'Join us for a casual evening to meet the forecast team and learn about the work that goes into keeping backcountry travelers informed and safe.',
        'What to Expect: Our forecasters will give a short presentation about their daily routine, the tools they use, and some of the challenging decisions they face. After the presentation, stick around to chat, ask questions, and connect with other backcountry enthusiasts in the community.',
        'This is a free, family-friendly event. No registration required, but RSVPs are appreciated for headcount.',
      ),
    },

    // Course by External Provider - Rec 1
    {
      title: 'AIARE Recreational Level 1',
      subtitle: '3-day comprehensive avalanche course',
      description:
        'Learn essential avalanche safety skills in this comprehensive 3-day course. Topics include avalanche rescue, terrain analysis, snowpack assessment, and decision-making frameworks.',
      startDate: futureDate(2, 14, 8),
      endDate: futureDate(2, 16, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Mountain Education Center',
        address: '567 Backcountry Road',
        city: 'Leavenworth',
        state: 'WA',
        zip: '98826',
        extraInfo: 'Course includes classroom sessions and field days',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/rec1-feb',
      registrationDeadline: futureDate(2, 1, 23),
      capacity: 8,
      cost: 450,
      skillRating: '0',
      eventType: eventTypes['course-by-external-provider'].id,
      eventSubType: eventSubTypes['rec-1'].id,
      modeOfTravel: 'ski',
      tenant: tenant.id,
      slug: 'aiare-recreational-level-1-february',
      content: simpleContent(
        'This AIARE Level 1 course is the standard for recreational avalanche education. Over three days, you will learn and practice essential avalanche safety skills.',
        'Course Format: Day 1 is classroom-based, covering avalanche fundamentals, weather, terrain, and human factors. Days 2 and 3 are field days where you will practice rescue, conduct snowpack tests, and make terrain decisions in real mountain environments.',
        'What to Bring: Full avalanche safety gear (beacon, shovel, probe), touring or splitboard setup, appropriate winter clothing, food and water for field days.',
        'Provider: This course is taught by certified instructors through Mountain Guides International.',
      ),
    },

    // Course by External Provider - Rec 2
    {
      title: 'AIARE Recreational Level 2',
      subtitle: 'Advanced avalanche education',
      description:
        'Build on your Level 1 knowledge with advanced terrain travel, complex snowpack analysis, and refined decision-making skills in this intensive 4-day course.',
      startDate: futureDate(3, 5, 8),
      endDate: futureDate(3, 8, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Alpine Skills Institute',
        address: '890 Summit Trail',
        city: 'Mazama',
        state: 'WA',
        zip: '98833',
        extraInfo: 'Backcountry lodging available nearby',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/rec2-march',
      registrationDeadline: futureDate(2, 20, 23),
      capacity: 6,
      cost: 650,
      skillRating: '2',
      eventType: eventTypes['course-by-external-provider'].id,
      eventSubType: eventSubTypes['rec-2'].id,
      modeOfTravel: 'ski',
      tenant: tenant.id,
      slug: 'aiare-recreational-level-2-march',
      content: simpleContent(
        'AIARE Level 2 is designed for experienced backcountry travelers who have completed a Level 1 course and want to advance their avalanche skills.',
        'Prerequisites: Completion of an AIARE Level 1 course (or equivalent) and significant backcountry experience. Students should be comfortable in avalanche terrain and have strong ski/split touring skills.',
        'Course Topics: Advanced weather analysis, complex terrain management, extended snowpack analysis, advanced decision-making frameworks, and managing uncertainty.',
        'Provider: Taught by Alpine Skills Institute, an A3-accredited course provider.',
      ),
    },

    // Course by External Provider - Rescue
    {
      title: 'Avalanche Rescue Course',
      subtitle: 'Master companion rescue techniques',
      description:
        'Intensive one-day rescue-focused course covering all aspects of companion rescue, from efficient beacon searching to advanced excavation techniques.',
      startDate: futureDate(1, 18, 8),
      endDate: futureDate(1, 18, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Snoqualmie Pass Parking Area',
        address: 'Interstate 90, Exit 52',
        city: 'Snoqualmie Pass',
        state: 'WA',
        zip: '98068',
        extraInfo: 'Meet at the west side parking area near the ski area',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/rescue-jan',
      registrationDeadline: futureDate(1, 10, 23),
      capacity: 12,
      cost: 175,
      skillRating: '1',
      eventType: eventTypes['course-by-external-provider'].id,
      eventSubType: eventSubTypes['rescue'].id,
      modeOfTravel: 'any',
      tenant: tenant.id,
      slug: 'avalanche-rescue-course-january',
      content: simpleContent(
        'This one-day rescue course provides intensive practice in companion rescue scenarios. Perfect as a refresher or for those wanting to build confidence in their rescue skills.',
        'Course Content: Multiple beacon search scenarios including single and multiple burials, probe line organization, strategic shoveling techniques, and managing rescue scenes.',
        'Requirements: Participants must bring their own avalanche safety equipment (beacon, shovel, probe). Previous avalanche education recommended but not required.',
        'Provider: Cascade Avalanche Education.',
      ),
    },

    // Course by External Provider - Pro 1
    {
      title: 'AIARE Pro 1 Course',
      subtitle: 'Professional avalanche training',
      description:
        'Professional Level 1 course designed for ski patrollers, guides, and others working in avalanche terrain. Covers forecasting, avalanche control, and professional decision-making.',
      startDate: futureDate(3, 20, 8),
      endDate: futureDate(3, 24, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Professional Mountain Training Center',
        address: '234 Pro Peak Way',
        city: 'Crystal Mountain',
        state: 'WA',
        zip: '98022',
        extraInfo: 'Includes both classroom and extensive field time',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/pro1-march',
      registrationDeadline: futureDate(2, 28, 23),
      capacity: 10,
      cost: 950,
      skillRating: '3',
      eventType: eventTypes['course-by-external-provider'].id,
      eventSubType: eventSubTypes['pro-1'].id,
      modeOfTravel: 'ski',
      tenant: tenant.id,
      slug: 'aiare-pro-1-march',
      content: simpleContent(
        'AIARE Pro 1 is the entry-level professional avalanche course for those working or aspiring to work in avalanche terrain.',
        'Prerequisites: Extensive avalanche education and backcountry experience required. Students should have completed Rec 2 or equivalent training and have multiple seasons of backcountry experience.',
        'Course Topics: Professional-level weather analysis, snowpack evaluation and forecasting, avalanche control methods, terrain and route selection for groups, avalanche program development, and professional decision-making frameworks.',
        'Provider: Professional Mountain Training Institute, staffed by experienced avalanche professionals.',
      ),
    },

    // Course by External Provider - Awareness by external provider
    {
      title: 'Know Before You Go',
      subtitle: 'Free avalanche awareness with local outfitter',
      description:
        'Free introductory avalanche awareness session offered by our partner outfitter. Great for beginners planning their first backcountry adventures.',
      startDate: futureDate(1, 12, 18),
      endDate: futureDate(1, 12, 20),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        isVirtual: false,
        venue: 'Mountain Gear Outfitters',
        address: '345 Outdoor Way',
        city: 'Issaquah',
        state: 'WA',
        zip: '98027',
        extraInfo: 'Free parking in rear lot',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/kbyg-jan',
      capacity: 40,
      cost: 0,
      skillRating: '0',
      eventType: eventTypes['course-by-external-provider'].id,
      eventSubType: eventSubTypes['awareness-external'].id,
      modeOfTravel: 'any',
      tenant: tenant.id,
      slug: 'know-before-you-go-january',
      content: simpleContent(
        'Know Before You Go is a free avalanche awareness program designed to introduce outdoor recreationists to avalanche safety basics.',
        "Topics Covered: Avalanche ABC's, terrain recognition, rescue equipment basics, and where to find avalanche information.",
        'Who Should Attend: This session is perfect for anyone new to winter backcountry travel, including snowshoers, skiers, snowboarders, and snowmobilers.',
        'Provider: Hosted by Mountain Gear Outfitters in partnership with regional avalanche educators.',
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
        venue: 'Commonwealth Basin Trailhead',
        address: 'Interstate 90, Exit 52',
        city: 'Snoqualmie Pass',
        state: 'WA',
        zip: '98068',
        extraInfo: 'Meet at the Commonwealth Basin parking area',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/womens-field-day',
      registrationDeadline: futureDate(2, 15, 23),
      capacity: 10,
      cost: 50,
      skillRating: '1',
      eventType: eventTypes['field-class-by-ac'].id,
      modeOfTravel: 'ski',
      tenant: tenant.id,
      slug: 'womens-avalanche-field-day',
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
        venue: 'Stevens Pass Nordic Center',
        address: 'US Highway 2',
        city: 'Skykomish',
        state: 'WA',
        zip: '98288',
        extraInfo: 'Meet at the Nordic Center lodge',
      },
      featuredImage: featuredImage?.id,
      registrationUrl: 'https://example.com/register/observer-training',
      registrationDeadline: futureDate(1, 18, 23),
      capacity: 15,
      cost: 0,
      skillRating: '1',
      eventType: eventTypes['volunteer'].id,
      modeOfTravel: 'ski',
      tenant: tenant.id,
      slug: 'backcountry-observer-training',
      content: simpleContent(
        'Become part of our community observation network! This training will teach you how to collect and submit high-quality avalanche observations.',
        'Training Topics: What forecasters need to know, how to conduct basic snowpack tests, photo guidelines, observation submission through our website, and field safety considerations.',
        'Requirements: Participants should be comfortable traveling in the backcountry and have completed at least an avalanche awareness session. Bring your own touring equipment and avalanche safety gear.',
        'Your observations make a difference! Community data is essential for accurate avalanche forecasting.',
      ),
    },
  ]
}
