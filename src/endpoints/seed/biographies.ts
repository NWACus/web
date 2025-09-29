import { upsert } from '@/endpoints/seed/upsert'
import { getSeedImageByFilename } from '@/endpoints/seed/utilities'
import type { Biography, Media, Team, Tenant } from '@/payload-types'
import { File, Payload, RequiredDataFromCollectionSlug } from 'payload'

export const seedStaff = async (
  payload: Payload,
  incremental: boolean,
  tenants: Record<string, Tenant>, // by tenant slug
  tenantsById: Record<number, Tenant>, // by id
): Promise<{ teams: Record<string, Team[]>; bios: Record<string, Record<string, Biography>> }> => {
  payload.logger.info(`— Seeding staff photos...`)

  const placeholder = await getSeedImageByFilename(
    'Profile_photo_placeholder_square.svg',
    payload.logger,
  )

  if (!placeholder) {
    throw new Error(`Getting placeholder photo returned null...`)
  }
  const placeholders = await upsert('media', payload, incremental, tenantsById, (obj) => obj.alt, [
    ...Object.values(tenants).map(
      (
        tenant,
      ): {
        data: RequiredDataFromCollectionSlug<'media'>
        file: File
      } => ({
        data: {
          tenant: tenant.id,
          alt: 'placeholder',
        },
        file: placeholder,
      }),
    ),
  ])

  const headshotData: { data: RequiredDataFromCollectionSlug<'media'>; file: File }[] = []
  for (const photo of headshots(tenants)) {
    const image = await getSeedImageByFilename(photo.filename, payload.logger)
    if (!image) {
      throw new Error(`Getting ${photo.alt} photo returned null...`)
    }
    headshotData.push({
      data: {
        tenant: photo.tenant.id,
        alt: photo.alt,
      },
      file: image,
    })
  }
  const photos = await upsert(
    'media',
    payload,
    incremental,
    tenantsById,
    (obj) => obj.alt,
    headshotData,
  )

  const bios = await upsert(
    'biographies',
    payload,
    incremental,
    tenantsById,
    (obj) => obj.name || 'UNKNOWN',
    biographies(tenants, tenantsById, photos, placeholders),
  )

  const teamData = teams(tenants, bios)
  const allTeams = await upsert(
    'teams',
    payload,
    incremental,
    tenantsById,
    (team) => team.name,
    teamData,
  )
  const orderedTeamsByTenant: Record<string, Team[]> = {}
  for (const tenant in allTeams) {
    orderedTeamsByTenant[tenant] = []
    for (const team of teamData) {
      if (typeof team.tenant === 'number' && tenantsById[team.tenant].slug === tenant) {
        orderedTeamsByTenant[tenant].push(allTeams[tenant][team.name])
      }
    }
  }
  return { teams: orderedTeamsByTenant, bios }
}

export const biographies: (
  tenants: Record<string, Tenant>, // by tenant slug
  tenantsById: Record<number, Tenant>, // by tenant slug
  images: Record<string, Record<string, Media>>, // by full name (alt text)
  placeholders: Record<string, Record<string, Media>>, // by tenant
) => RequiredDataFromCollectionSlug<'biographies'>[] = (
  tenants: Record<string, Tenant>, // by tenant slug
  tenantsById: Record<number, Tenant>, // by tenant slug
  images: Record<string, Record<string, Media>>, // by full name (alt text)
  placeholders: Record<string, Record<string, Media>>, // by tenant
): RequiredDataFromCollectionSlug<'biographies'>[] => {
  const biographies: RequiredDataFromCollectionSlug<'biographies'>[] = [
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Kelsey Noonan',
      title: 'Secretary',
      start_date: '2021-10-01',
      biography:
        'Kelsey is a social impact strategist who works with philanthropic organizations, governments, and non-profits to improve health and development outcomes. Kelsey currently works at Pivotal Ventures, the innovation and incubation company created by Melinda French Gates. Previously she spent more than a decade working in crisis settings from Syria to Afghanistan. Kelsey is happiest travelling uphill – running, climbing and backcountry skiing – and she is passionate about inclusive access to outdoor recreation, especially for winter sports. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Kendall Stever',
      title: 'Treasurer',
      start_date: '2017-10-01',
      biography:
        'Board member since 2017. Kendall has more than 30 years of professional accounting and finance experience in the high tech and life science industries.  A graduate of the University of Washington, he has held CFO and other executive level positions, started a consulting business and worked as an auditor with a Big 4 public accounting firm.  A native of Seattle, Kendall is a lifelong skier and backcountry adventurer.  Serving on the NWAC board is an ideal way to combine his love of the outdoors with his professional background while helping NWAC achieve its mission of educating the community and promoting safe travel in the backcountry.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Scott Schell',
      title: 'Executive Director',
      start_date: null,
      biography:
        'Scott Schell is the Executive Director of the non-profit arm of the Northwest Avalanche Center. Scott has served as the Program Director since 2012 and as the ED for the past three seasons.\n\nHe’s excited to help equip and empower all types of backcountry users to get out an enjoy the wintertime mountains. And he’s truly thankful to be a part of such an amazing team during this time of significant growth of NWAC.\n\nAn avid ski mountaineer, Scott has been involved in avalanche and guiding education for the past 20 years. He’s a former Instructor and Instructor Trainer for the American Institute for Avalanche Research and Education (AIARE). As a certified American Mountain Guides Association (AMGA) Ski Mountaineering Guide, Scott has guided throughout the United States, Alaska, Canada, and Europe. He’s a former AMGA ski discipline instructor and has several first descents in the PNW.\n\nScott is the co-author of Backcountry Skiing, Skills for Ski Touring and Ski Mountaineering (Mountaineers Press, 2007)—a single-source how-to book on skiing the backcountry.\n\nHis spare time consists of planning and completing multiday wilderness trips with his family and is looking forward to sharing the slopes with his two-year-old daughter this season.  ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Gavin Woody',
      title: 'President',
      start_date: '2017-12-01',
      biography:
        'As a passionate backcountry skier, father of two young children (who love to ski!), and an advocate for responsible recreating in the backcountry, I’m honored to have served on the NWAC Board since 2017. In addition to skiing, I love taking advantage of all the outdoor activities the PNW has to offer: ultrarunning, mountaineering. biking, hunting, and fishing. Originally from California, I served as a U.S. Army infantry captain and am a decorated combat veteran (Operation Iraqi Freedom). My professional background includes management consulting with McKinsey & Company and operations executive roles at Expedia, A Place For Mom, and Porch Group, where I currently lead our insurance agency. I hold a mechanical engineering degree, with honors, from the United States Military Academy at West Point and an MBA from the Stanford Graduate School of Business.',
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Louise Stumph',
      title: 'Director',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Megan Stevenson',
      title: 'Treasurer',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Hannah Marshall',
      title: 'Executive Director',
      start_date: null,
      biography:
        'Hannah is the Executive Director of the Friends of the SAC. The Friends are a local non-profit that shares a common mission with the avalanche center and provide approximately 50% of the SAC’s annual operating budget. To learn more about the Friends and how to support them, visit friends.sawtoothavalanche.com.',
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Chris Lundy',
      title: 'Avalanche Specialist, National Avalanche Center',
      start_date: null,
      biography:
        'Chris works for the National Avalanche Center and remains involved with the Sawtooth Avalanche Center as a forecaster emeritus. Chris has over 20 years of diverse professional experience with snow and avalanches, including 13 seasons with SAC. After earning an MS in Civil Engineering from Montana State University, Chris has worked as a researcher, ski patroller, highway avalanche forecaster, backcountry ski guide, backcountry avalanche forecaster, and web developer. Chris lives in Stanley and enjoys mountain travel in all of its forms.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'John Swanson',
      title: 'Advisory Board',
      start_date: null,
      biography:
        'John is a local emergency physician, teacher, father of two budding skiers, and ski enthusiast.  He brings a background in fundraising to SAC, and dreams of one day building a SAC endowment.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Bob Moore',
      title: 'Advisory Board',
      start_date: null,
      biography:
        'Bob recently retired from the US Forest Service after 37+ years. He spent the last 25 years as the Winter Sports Specialist on the Truckee Ranger District. Among his duties was the administration of the permits of the local ski areas (Alpine Meadows, Squaw Valley, Boreal, Donner Ski Ranch, Royal Gorge) on National Forest lands and the avalanche forecasting program (as it was known at that time). He coordinated the military artillery used in avalanche control for Region 5 of the Forest Service (California). He usually spent much of the summer months managing large fires as an Operations Section Chief or Safety Officer across the west.\n\nProfessionally Bob was one of the early members of the American Avalanche Association, served two terms as a Director with Tahoe Nordic Search and Rescue and was one of the founding members of the Avalanche Artillery Users Committee of North America. He was nominated and elected to the B-77 ANSI committee for tramways representing recreation within the Forest Service. Bob was the advisor to the Forest Service Regional Office in explosive and artillery use for avalanche control and winter sports.\n\nIn 2005 he put together the concept of the Sierra Avalanche Center which stared with Brandon as a volunteer forecaster to assist him in the forecasting duties. Previous to that Bob was a one person shop putting out avalanche advisories when the hazard was HIGH or above for 20 years. He served as the Forest Service advisor/representative to the board in the early years ensuring that Forest Service support and resources were available. He was the supervisor of the forecasters until his retirement setting the direction of the program.\n\nHe has been married for 33 years, has two grown children and 1 Golden Retriever Dog who travels with him in the backcountry. He has lived in the Truckee/Tahoe area for 38 years.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Neil Morse',
      title: 'Advisory Board',
      start_date: null,
      biography:
        "Neil Morse came out to Tahoe as a wide-eyed 20-year-old from New Hampshire in the winter of 1989 and was soon hooked on the Sierra's snow and terrain at Squaw Valley and Alpine Meadows. He went into the back country for the first time via the gates at Alpine Meadows. He is a Realtor, a ski instructor at Squaw Valley, a ski searcher for the Tahoe Nordic Search and Rescue Team and is a father of two skiing boys. Over the years, he's lost friends to avalanches and has heard  too many stories about skier and rider mishaps in the back country so he decided it was time to volunteer to help get the word out about avalanche awareness. He's completed his Avalanche Level II and hopes to continue to be a life-long learner.",
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Holly Yocum',
      title: 'Advisory Board',
      start_date: null,
      biography:
        'Holly is fortunate to have spent her life playing in the Sierra Nevada.  A lover of any form of sliding on skis in the snow, Holly has been a full time backcountry user since the turn of the century.  Upon learning that alpine touring is supported by a network of mountain huts in many countries, she combined a love of travel and backcountry skiing to pursue ski tours in Norway, Morocco, the Alps of France, Switzerland, Italy and Austria. \n\nHolly became interested in the dynamics and dangers of avalanches after the Alpine Meadows avalanche in 1982 and as a result of her travels in avalanche terrain during her backcountry adventures.  She believes that education, awareness and access to avalanche advisories have the power to alter and improve decision making, allowing for safer backcountry use.  \n\nHolly lives, works and plays in Incline Village, using her degree in geology to bore her friends on long trail runs.',
    },
    {
      tenant: tenants['dvac'].id,
      photo: 1,
      name: 'Deva McDeverson',
      title: 'Fullstack Developer',
      start_date: null,
      biography: 'Hello.',
    },
    {
      tenant: tenants['dvac'].id,
      photo: 1,
      name: 'Eng McEngerson',
      title: 'Backend Engineer',
      start_date: null,
      biography: 'Goodbye.',
    },
    {
      tenant: tenants['dvac'].id,
      photo: 1,
      name: 'PM McPmerson',
      title: 'Product Manager',
      start_date: null,
      biography: 'Goodbye.',
    },
    {
      tenant: tenants['dvac'].id,
      photo: 1,
      name: 'UX McDesignerson',
      title: 'UX Designer',
      start_date: null,
      biography: 'Goodbye.',
    },
  ]

  for (let i = 0; i < biographies.length; i++) {
    const name = biographies[i].name
    if (name) {
      const tenant = biographies[i].tenant
      const tenantSlug: string = typeof tenant === 'object' ? tenant.slug : tenantsById[tenant].slug
      if (tenantSlug in images && name in images[tenantSlug] && images[tenantSlug][name]) {
        biographies[i].photo = images[tenantSlug][name].id
      } else if (tenantSlug in placeholders && placeholders[tenantSlug]['placeholder']) {
        biographies[i].photo = placeholders[tenantSlug]['placeholder'].id
      } else {
        throw new Error(`no photo or placeholder for biography['${tenantSlug}']['${name}']`)
      }
    }
  }

  return biographies
}

export const headshots = (
  tenants: Record<string, Tenant>,
): { alt: string; filename: string; tenant: Tenant }[] => {
  return [
    {
      alt: 'Kelsey Noonan',
      filename: 'kelsey_noonan.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Kendall Stever',
      filename: 'kendall_stever.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Scott Schell',
      filename: 'scott_schell.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Gavin Woody',
      filename: 'gavin_woody.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Louise Stumph',
      filename: 'louise_stumph.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Megan Stevenson',
      filename: 'megan_stevenson.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Chris Lundy',
      filename: 'chris_lundy.webp',
      tenant: tenants['snfac'],
    },
  ]
}

export const teams: (
  tenants: Record<string, Tenant>,
  bios: Record<string, Record<string, Biography>>,
) => RequiredDataFromCollectionSlug<'teams'>[] = (
  tenants: Record<string, Tenant>,
  bios: Record<string, Record<string, Biography>>,
): RequiredDataFromCollectionSlug<'teams'>[] => {
  const teams: RequiredDataFromCollectionSlug<'teams'>[] = [
    {
      tenant: tenants['dvac'].id,
      name: 'Development',
      members: [bios['dvac']['Deva McDeverson'].id],
    },
    {
      tenant: tenants['nwac'].id,
      name: 'Non-Profit Staff',
      members: [bios['nwac']['Scott Schell'].id],
    },
    {
      tenant: tenants['nwac'].id,
      name: 'Non-Profit Board of Directors Officers',
      members: [
        bios['nwac']['Gavin Woody'].id,
        bios['nwac']['Kelsey Noonan'].id,
        bios['nwac']['Kendall Stever'].id,
      ],
    },
    {
      tenant: tenants['snfac'].id,
      name: 'Forecasters',
      members: [bios['snfac']['Chris Lundy'].id],
    },
    {
      tenant: tenants['snfac'].id,
      name: 'Non-Profit Staff',
      members: [bios['snfac']['Hannah Marshall'].id],
    },
    {
      tenant: tenants['snfac'].id,
      name: 'Non-Profit Board of Directors',
      members: [bios['snfac']['Megan Stevenson'].id, bios['snfac']['Louise Stumph'].id],
    },
    {
      tenant: tenants['sac'].id,
      name: 'Advisory Board',
      members: [
        bios['sac']['John Swanson'].id,
        bios['sac']['Bob Moore'].id,
        bios['sac']['Neil Morse'].id,
        bios['sac']['Holly Yocum'].id,
      ],
    },
  ]

  return teams
}
