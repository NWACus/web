import { Media, Provider } from '@/payload-types'
import { US_TIMEZONES } from '@/utilities/timezones'
import { Payload, RequiredDataFromCollectionSlug } from 'payload'

export const getCoursesData = (
  featuredImage?: Media,
  providers?: {
    'Alpine Skills International'?: Provider
    'Mountain Education Center'?: Provider
    'Backcountry Alliance'?: Provider
    'Pro Avalanche Training'?: Provider
  },
): RequiredDataFromCollectionSlug<'courses'>[] => {
  // Helper to create dates in the future
  const futureDate = (monthOffset: number, day: number, hour: number = 18) => {
    const date = new Date()
    date.setMonth(date.getMonth() + monthOffset)
    date.setDate(day)
    date.setHours(hour, 0, 0, 0)
    return date.toISOString()
  }

  return [
    // AIARE Rec 1 - Mountain Education Center
    {
      title: 'AIARE Recreational Level 1',
      subtitle: '3-day comprehensive avalanche course',
      description:
        'Learn essential avalanche safety skills in this comprehensive 3-day course. Topics include avalanche rescue, terrain analysis, snowpack assessment, and decision-making frameworks.',
      startDate: futureDate(2, 14, 8),
      endDate: futureDate(2, 16, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        placeName: 'Mountain Education Center',
        address: '567 Backcountry Road',
        city: 'Leavenworth',
        state: 'WA',
        zip: '98826',
      },
      courseUrl: 'https://example.com/register/rec1-feb',
      registrationDeadline: futureDate(2, 1, 23),
      courseType: 'rec-1',
      modeOfTravel: ['ski'],
      provider: providers?.['Mountain Education Center']?.id,
      slug: 'aiare-recreational-level-1-february',
      _status: 'published',
    },

    // AIARE Rec 2 - Alpine Skills International
    {
      title: 'AIARE Recreational Level 2',
      subtitle: 'Advanced avalanche education',
      description:
        'Build on your Level 1 knowledge with advanced terrain travel, complex snowpack analysis, and refined decision-making skills in this intensive 4-day course.',
      startDate: futureDate(3, 5, 8),
      endDate: futureDate(3, 8, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        placeName: 'Alpine Skills Institute',
        address: '890 Summit Trail',
        city: 'Mazama',
        state: 'WA',
        zip: '98833',
      },
      courseUrl: 'https://example.com/register/rec2-march',
      registrationDeadline: futureDate(2, 20, 23),
      courseType: 'rec-2',
      modeOfTravel: ['ski'],
      provider: providers?.['Alpine Skills International']?.id,
      slug: 'aiare-recreational-level-2-march',
      _status: 'published',
    },

    // Avalanche Rescue - Backcountry Alliance
    {
      title: 'Avalanche Rescue Course',
      subtitle: 'Master companion rescue techniques',
      description:
        'Intensive one-day rescue-focused course covering all aspects of companion rescue, from efficient beacon searching to advanced excavation techniques.',
      startDate: futureDate(1, 18, 8),
      endDate: futureDate(1, 18, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        placeName: 'Snoqualmie Pass Parking Area',
        address: 'Interstate 90, Exit 52',
        city: 'Snoqualmie Pass',
        state: 'WA',
        zip: '98068',
      },
      courseUrl: 'https://example.com/register/rescue-jan',
      registrationDeadline: futureDate(1, 10, 23),
      courseType: 'rescue',
      modeOfTravel: ['ski', 'splitboard', 'snowshoe'],
      provider: providers?.['Backcountry Alliance']?.id,
      slug: 'avalanche-rescue-course-january',
      _status: 'published',
    },

    // AIARE Pro 1 - Pro Avalanche Training
    {
      title: 'AIARE Pro 1 Course',
      subtitle: 'Professional avalanche training',
      description:
        'Professional Level 1 course designed for ski patrollers, guides, and others working in avalanche terrain. Covers forecasting, avalanche control, and professional decision-making.',
      startDate: futureDate(3, 20, 8),
      endDate: futureDate(3, 24, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        placeName: 'Professional Mountain Training Center',
        address: '234 Pro Peak Way',
        city: 'Crystal Mountain',
        state: 'WA',
        zip: '98022',
      },
      courseUrl: 'https://example.com/register/pro1-march',
      registrationDeadline: futureDate(2, 28, 23),
      courseType: 'pro-1',
      modeOfTravel: ['ski'],
      provider: providers?.['Pro Avalanche Training']?.id,
      slug: 'aiare-pro-1-march',
      _status: 'published',
    },

    // Know Before You Go - Backcountry Alliance
    {
      title: 'Know Before You Go',
      subtitle: 'Free avalanche awareness with local outfitter',
      description:
        'Free introductory avalanche awareness session offered by our partner outfitter. Great for beginners planning their first backcountry adventures.',
      startDate: futureDate(1, 12, 18),
      endDate: futureDate(1, 12, 20),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        placeName: 'Mountain Gear Outfitters',
        address: '345 Outdoor Way',
        city: 'Issaquah',
        state: 'WA',
        zip: '98027',
      },
      courseUrl: 'https://example.com/register/kbyg-jan',
      registrationDeadline: futureDate(1, 10, 23),
      courseType: 'awareness-external',
      modeOfTravel: ['ski', 'splitboard', 'motorized', 'snowshoe'],
      provider: providers?.['Backcountry Alliance']?.id,
      slug: 'know-before-you-go-january',
      _status: 'published',
    },

    // AIARE Rec 1 for Splitboarders - Alpine Skills International
    {
      title: 'AIARE Rec 1 for Splitboarders',
      subtitle: 'Avalanche course tailored for splitboarders',
      description:
        'AIARE Level 1 course designed specifically for splitboarders, with instruction and terrain selection optimized for splitboard travel.',
      startDate: futureDate(2, 21, 8),
      endDate: futureDate(2, 23, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        placeName: 'Alpine Skills International HQ',
        address: '123 Mountain View Drive',
        city: 'Tahoe City',
        state: 'CA',
        zip: '96145',
      },
      courseUrl: 'https://alpineskills.com/register/splitboard-rec1',
      registrationDeadline: futureDate(2, 10, 23),
      courseType: 'rec-1',
      modeOfTravel: ['splitboard'],
      provider: providers?.['Alpine Skills International']?.id,
      slug: 'aiare-rec1-splitboarders',
      _status: 'published',
    },

    // AIARE Pro 2 - Pro Avalanche Training
    {
      title: 'AIARE Pro 2 Course',
      subtitle: 'Advanced professional avalanche training',
      description:
        'Professional Level 2 course for experienced avalanche professionals. Advanced forecasting, program management, and decision-making for complex operations.',
      startDate: futureDate(4, 10, 8),
      endDate: futureDate(4, 14, 17),
      timezone: US_TIMEZONES.MOUNTAIN,
      location: {
        placeName: 'Pro Avalanche Training Center',
        address: '321 Powder Boulevard',
        city: 'Jackson',
        state: 'WY',
        zip: '83001',
      },
      courseUrl: 'https://proavatraining.com/register/pro2-april',
      registrationDeadline: futureDate(3, 25, 23),
      courseType: 'pro-2',
      modeOfTravel: ['ski'],
      provider: providers?.['Pro Avalanche Training']?.id,
      slug: 'aiare-pro-2-april',
      _status: 'published',
    },

    // Women's AIARE Rec 1 - Mountain Education Center
    {
      title: "Women's AIARE Rec 1",
      subtitle: 'Avalanche course by women, for women',
      description:
        'AIARE Level 1 course taught by experienced female instructors in a supportive, women-only environment.',
      startDate: futureDate(3, 12, 8),
      endDate: futureDate(3, 14, 17),
      timezone: US_TIMEZONES.PACIFIC,
      location: {
        placeName: 'Mountain Education Center',
        address: '456 Cascade Loop',
        city: 'Leavenworth',
        state: 'WA',
        zip: '98826',
      },
      courseUrl: 'https://mountainedu.com/register/womens-rec1',
      registrationDeadline: futureDate(2, 28, 23),
      courseType: 'rec-1',
      modeOfTravel: ['ski', 'splitboard', 'snowshoe'],
      provider: providers?.['Mountain Education Center']?.id,
      slug: 'womens-aiare-rec1',
      _status: 'published',
    },

    // Avalanche Rescue Refresher - Backcountry Alliance
    {
      title: 'Avalanche Rescue Refresher',
      subtitle: 'Sharpen your rescue skills',
      description:
        'Half-day rescue skills refresher for those who have completed formal avalanche training and want to practice their skills.',
      startDate: futureDate(1, 30, 9),
      endDate: futureDate(1, 30, 13),
      timezone: US_TIMEZONES.MOUNTAIN,
      location: {
        placeName: 'Durango Nordic Center',
        address: '789 Summit Street',
        city: 'Durango',
        state: 'CO',
        zip: '81301',
      },
      courseUrl: 'https://backcountryalliance.org/rescue-refresher',
      registrationDeadline: futureDate(1, 25, 23),
      courseType: 'rescue',
      modeOfTravel: ['ski', 'splitboard', 'snowshoe'],
      provider: providers?.['Backcountry Alliance']?.id,
      slug: 'rescue-refresher-jan',
      _status: 'published',
    },
  ]
}

export const seedCourses = async (
  payload: Payload,
  incremental: boolean,
  providers?: {
    'Alpine Skills International'?: Provider
    'Mountain Education Center'?: Provider
    'Backcountry Alliance'?: Provider
    'Pro Avalanche Training'?: Provider
  },
): Promise<void> => {
  const coursesData = getCoursesData(undefined, providers)

  if (incremental) {
    payload.logger.info(`— Creating ${coursesData.length} courses...`)
    for (const courseData of coursesData) {
      await payload.create({
        collection: 'courses',
        data: courseData,
      })
    }
  } else {
    payload.logger.info(`— Clearing courses...`)
    await payload.delete({
      collection: 'courses',
      where: {},
    })
    payload.logger.info(`— Creating ${coursesData.length} courses...`)
    for (const courseData of coursesData) {
      await payload.create({
        collection: 'courses',
        data: courseData,
      })
    }
  }
}
