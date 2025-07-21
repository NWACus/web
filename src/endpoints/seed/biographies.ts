import { upsert } from '@/endpoints/seed/upsert'
import { getSeedImageByFilename } from '@/endpoints/seed/utilities'
import type { Biography, Media, Team, Tenant, User } from '@/payload-types'
import { File, Payload, RequiredDataFromCollectionSlug } from 'payload'

export const seedStaff = async (
  payload: Payload,
  incremental: boolean,
  tenants: Record<string, Tenant>, // by tenant slug
  tenantsById: Record<number, Tenant>, // by id
  users: Record<string, User>, // by full name
): Promise<{ teams: Record<string, Team[]>; bios: Record<string, Record<string, Biography>> }> => {
  payload.logger.info(`— Seeding staff photos...`)

  const placeholder = await getSeedImageByFilename('Profile_photo_placeholder_square.svg')

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
    const image = await getSeedImageByFilename(photo.filename)
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
    biographies(tenants, tenantsById, photos, placeholders, users),
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
  users: Record<string, User>, // by full name
) => RequiredDataFromCollectionSlug<'biographies'>[] = (
  tenants: Record<string, Tenant>, // by tenant slug
  tenantsById: Record<number, Tenant>, // by tenant slug
  images: Record<string, Record<string, Media>>, // by full name (alt text)
  placeholders: Record<string, Record<string, Media>>, // by tenant
  users: Record<string, User>, // by full name
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
      name: 'Craig Shank',
      title: null,
      start_date: '2022-10-01',
      biography:
        'NWAC board member since 2022. With a lifelong love of the outdoors, Craig is an enthusiastic Nordic, backcountry and alpine skier, and hikes and sails during snowless months. As both lawyer and former tech executive, Craig advises businesses, nonprofits, government, and academic communities on developing issues at the intersection of emerging technologies, law, and society. Craig was drawn to work with NWAC by the organization’s deliberate commitment to learning, to supporting informed decisions and safety for all, and to an equitable, diverse, and growing backcountry community.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Chris Potts',
      title: null,
      start_date: '2023-10-01',
      biography:
        'In 2010, Chris Co-Founded the Bouldering Project, whom he was a Managing Partner through 2021. In addition to his role on the NWAC Board, Chris currently serves on the Board of The Springs, tries to keep up with his family, and advises startups and nonprofits. His secret is that he skis (outdoors) more than he climbs, and none of it is ever enough.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Lewis Turner',
      title: null,
      start_date: '1998-03-01',
      biography:
        'Board member since 1998, Lewis was NWAC Treasurer from 2003 to 2019. He is an avid alpine hiker, scrambler and snowshoer. He developed the Everett Mountaineers avalanche course, and taught avalanche, climbing and scrambling courses for The Mountaineers for 10 years. He served on many Mountaineers committees and produced many scrambling, leadership and avalanche publications. He has over 35 years of professional accounting experience, including 30 years with the Seattle Department of Parks & Recreation. Lewis managed their accounting department for 15 years and their annual budget development process for 15 years. He also has professional accounting experience as the business manager and Assistant Zoo Director of the Oklahoma City Zoo, one of the top five zoos in the US.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Roland Emetaz',
      title: null,
      start_date: '1998-03-01',
      biography:
        'Ronald "Em" Emetaz has been with NWAC since the beginning and on the board since 1998. “Em” is a retired Forester with the US Forest Service, Pacific NW Region, spending his career advocating outdoor safety, quality customer service and teamwork, Mr. EM continues as a volunteer teaching those lessons. He provides avalanche awareness programs on behalf of the NWAC various audiences. He is often on assignment with the Central Washington All Hazards Incident Management Team (one of 54 in the Nation) managing incidents as diverse as wildfires and hurricanes, from the Arctic Circle to the Gulf Coast.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Tyler Frisbee',
      title: null,
      start_date: '2023-10-01',
      biography:
        'Tyler has been skiing since her mom took her to the bunny slope before afternoon kindergarten. She started backcountry skiing in 2014 to make skiing more of an outdoor experience, more of a workout, and not as darn expensive! She’s most often found on Mt. Hood or in the Three Sisters wilderness but will venture as far north as Mt. St. Helens and Mt. Adams. Professionally Tyler works as a senior advisor to Congressman Earl Blumenauer and has been a political advocate and strategist for her entire career, focusing on transportation and land use issues. These days Tyler spends as much time teaching her young kid to ski as she does breaking trail in the backcountry, but she’s passionate about helping people get outside and experience the out-of-doors safely, no matter how they’re doing it.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Becca Cahall',
      title: null,
      start_date: '2022-10-01',
      biography:
        'Becca Cahall is the co-founder and CEO of Duct Tape Then Beer, a small creative agency in Seattle, WA that specializes in creating beloved podcasts and documentary films. She toggles between overseeing the business side and leading the creative production of projects designed to reach millions. Previously, she was a field biologist and researcher, partnering with USFS, the BLM, and universities to study the effects of fire and forest management on bird populations. In the winter, she’s more comfortable setting a skin track than skiing through moguls after her sons. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Angie Fidler',
      title: null,
      start_date: '2022-10-01',
      biography:
        'Midwestern roots. Laughability: A+. “Efficient” is my favorite word. Nerdy finance professional with a passion for our communities and an expertise in finance and operations.\n\nRetired CPA with over 15 years of experience focused predominantly in the not-for-profit arena. I started my career in public accounting performing tax compliance, research, and planning including specialty issues such as excess benefit transactions, unrelated business income, and employee benefits.\n\nSince leaving public accounting, I still happily serve the nonprofit industry but as a finance and accounting professional. I provide analysis for current financials, budget to actual, forecasting, and strategic planning. I support programs by partnering with programmatic leaders to efficiently run their business segments: review new opportunities, plan for capacity, budgeting and forecasting. I also support programs by streamlining operational processes – review of current processes and structures and implementation of technology to further increase capacity and gain efficiencies.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Ashley Hartz',
      title: null,
      start_date: '2022-10-01',
      biography:
        'Ashley is a measurement expert and strategist focused on the intersection of social impact, business, and development. She helps organizations across the public and private sectors to understand and cultivate impact by using research to drive improved sustainable development outcomes. Ashley is an avid backcountry skier who has taught skiing in Colorado, California, Afghanistan, and Iraq and is committed to increasing access to mountain sports.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Phaedra Beckert',
      title: null,
      start_date: '2021-10-01',
      biography:
        'Phaedra joined the NWAC Board in 2021 because of her passion to help people travel into the backcountry safely, so they can appreciate our wild places. She works in philanthropy with the Western Washington University Foundation and brings nearly twenty years of environmental advocacy and fundraising expertise. Phaedra cut her backcountry teeth volunteering with the Mt Hood Ski Patrol Nordic patrol. When it’s not winter or volcano season, she tosses a leg over a mountain bike or checks the wind forecast for kiting. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Michael Manuel',
      title: null,
      start_date: '2021-10-01',
      biography:
        'Mike loves connecting with nature via snowboarding, splitboarding, climbing, surfing, and mountain biking. Based in the PNW area (Lands of the Coast Salish and Duwamish Peoples), he is passionate about sharing experiences in the mountains, creating pathways for traditionally underrepresented communities to connect to nature, and ensuring all can recreate safely with the proper education and resources. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Zachary Buzaid',
      title: null,
      start_date: '2019-10-01',
      biography:
        'Board member since 2019. Zach is a software professional that has led development teams across many industries. He currently is a Principal Consultant at Slalom Build. Zach has been skiing since he could walk and used to write avalanche software while living on the East Coast. In an effort to find more ski touring partners, he began volunteering for NWAC when he first moved to Seattle in 2017. Since then they haven’t been able to shake him loose! When he’s not on the snow you can find Zach on his mountain bike, most likely accompanied by his dog Nelson. Zach currently serves on the Technology and Recruiting committees.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Berger Dodge',
      title: null,
      start_date: '2018-10-01',
      biography:
        'Board member since 2018. Berger brings 20+ years of finance experience to his role as member of the NWAC Board and NWAC Finance Committee. He grew up skiing and mountaineering in the Pacific Northwest, and started backcountry touring on high-performance leather telemark boots and three-pin bindings. Berger attended college at Boston University, where he competed with the B.U. alpine ski team, and received his MBA from the University of Washington. He currently serves as Chief Financial Officer of Lease Crutcher Lewis, a Seattle-based commercial general contractor. As a former professional ski patroller, Berger recognizes NWAC’s unique position as a critical resource for the Northwest winter mountain sports community, and honored to play a role in its ongoing development.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'David Gorton',
      title: null,
      start_date: '2018-10-01',
      biography:
        'A member of the NWAC board since 2018, David is a fundraising professional with more than 15 years of experience working with regional and national nongovernmental organizations. An avid skier and mountain enthusiast, David is proud to support NWAC’s efforts to become a stronger and more effective organization. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Sarah Courtney',
      title: null,
      start_date: '2017-10-01',
      biography:
        'Board member since 2017. Sarah currently works at Rad Power Bikes as a Senior Product Manager and formerly worked at Cascade Designs as the MSR Category Manager of Winter Products. Sarah has a degree in Mechanical Engineering and a Master’s degree in Supply Chain from MIT. Prior to that, she spent two years with the Peace Corps in Queretaro, Mexico working on Technology Transfer. Outside of work, Sarah used to enjoy suffering in adventure races like EcoChallenge 2000-Borneo, 2001-NZ and 2002 Fiji and now enjoys slogging it with 3 kids skiing, biking, hiking, climbing, running in a more “relaxed” adventurey sort of way. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Heather Karell',
      title: null,
      start_date: '2017-10-01',
      biography:
        'Board member since 2017. Heather is an attorney who focuses her practice on complex commercial transactions, technology and intellectual property licensing, strategic counseling, and privacy, data security and e-commerce matters. A graduate of the University of Michigan Law School, Heather previously worked as a legal fellow for the Natural Resources Defense Council. Prior graduate school, she lived and worked in Vail, Colorado and continues to spend much of her time outside of work in the mountains with her family. She is an avid telemark and cross-country skier, cyclist, and trail runner. She appreciates the opportunity to work with NWAC to help the organization fulfill its mission and encourage safe recreation in the backcountry.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Jon Ferrian',
      title: null,
      start_date: '2017-08-01',
      biography:
        'Jon joined the Board in 2016 to help with NWACs renewed outreach to the snowmobile community and in 2020 stepped into the role of Vice President for our Board of Directors. He is a life long snowmobiler and originates from Brainerd, Minnesota. Snowmobiling in vertical terrain began in 2007 with his first trip to Cook City, Montana where he was exposed to avalanche terrain and the risks associated with it. Jon is active with organization including local Snowmobile Clubs, Washington State Snowmobile Association, the Motorized Avalanche Alliance, and with AIARE where he has started a the #LiveLARGEUniversity Motorized Avalanche Education Scholarship program in May of 2020 that has grown to be the largest avalanche education scholarship at AIARE. He also conducts a weekly Live Podcast on YouTube called Live LARGE Universe in which he interviews recreationalists and industry experts across North America on Motorized Avalanche Safety and Education. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Erik Chelstad',
      title: null,
      start_date: '2016-10-01',
      biography:
        'Having been on the board since October of 2016, Erik has seen avalanche gear progress from long sharp sticks to electronic transceivers. Erik grew up in the PNW working on fishing boats, scaling glaciers with logging corks, and ski patrolling. Erik is the CTO & Co-Founder of a tech company, Observa, and is passionate about continuing the growth of the intersection of technology and adventure to make things safer, but no less sweaty and “adventurous.” Erik has degrees in computer and electrical engineering from Purdue and an MBA from UW and teaches AIARE courses, usually with the Mountaineers.',
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
      name: 'Arun Jacob',
      title: 'Vice President',
      start_date: '2019-10-01',
      biography:
        'Arun moved to Seattle for a software internship in 1992, fell in love with the mountains and the water, and has been here ever since. He is excited to leverage his professional passion for data and analytics to help NWAC educate and equip the backcountry community with the information they need to be safe. In his free time, he gets outside as much as possible on a snowboard, a paddleboard, or a mountain bike.',
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
      name: 'Olin Glenne',
      title: 'Director',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Tyler Ferris',
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
      name: 'Erin Zell',
      title: 'Secretary',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Steve Butler',
      title: 'Director',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Travis Vandenburgh',
      title: 'Vice President',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Ryan Guess',
      title: 'President',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Annie DeAngelo',
      title: 'Education Coordinator',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Dawn Bird',
      title: 'Financial Coordinator',
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
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Brooke Maushund',
      title: 'Avalanche Specialist',
      start_date: null,
      biography:
        'Harnessing her lifelong love of unnecessary and prolonged physical suffering in beautiful settings, Brooke used her B.S. in Resource Science from UC Berkeley to work on off-grid renewable energy projects in Tanzania and Eastern Nicaragua before moving to Yosemite in her early 20s. Determined to find a better ‘work vs. climbing/skiing’ balance, she pivoted to a job as a weather station technician with the Park Service and soon set her sights on avalanche forecasting. Her path to get there included working as a ski patroller, ski guide, avalanche instructor, snow surveyor, and professional observer for operations in CA and WA. Cutting her teeth toiling away on El Capitan and sliding down remote hallways in the High Sierra, Brooke has a knack for hard work in less-than-ideal conditions — laughing through any mishaps along the way. She spent the summer months managing risk as a member of Yosemite Valley Search and Rescue, on a Denali rescue patrol, and, most recently, as a climbing ranger on Mt. Rainier.',
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Ethan Davis',
      title: 'Avalanche Specialist',
      start_date: null,
      biography:
        'Ethan began working as a forecaster with the Sawtooth Avalanche Center in 2015. His interest in snow started at Anthony Lakes, a mom-and-pop ski hill in rural Eastern Oregon. He attended the University of Idaho, where he earned his Bachelor of Science in Geography and a minor in Mathematics. Following an interest in winter storms he earned his Master’s degree in Meteorology from Pennsylvania State University. After three years in a dark lab growing ice crystals, Ethan returned to the light as a forecaster in Alaska and Colorado before making his way home to Idaho. When not in the snow, you can find him camping, backpacking, hunting, and climbing with his wife and two young boys. ',
    },
    {
      tenant: tenants['snfac'].id,
      photo: 1,
      name: 'Scott Savage',
      title: 'Forecast Director',
      start_date: null,
      biography:
        'Scott began poking around the mountains in the late 1980s while earning degrees in Chemistry and Molecular Biology from the University of Colorado at Boulder. He headed to Big Sky, Montana to ski-bum for a winter before enrolling in medical school… or so he thought. Scott ended up spending the better part of two decades as a Ski Patroller, Avalanche Forecaster, and Snow Safety Director at Big Sky Resort before joining the SAC program in 2012. He has presented at many international avalanche conferences and regional professional seminars and is a regular contributor to The Avalanche Review. Scott is a National Avalanche School instructor, President of the American Avalanche Association, and President of Avalanche Worker Safety. He likes to spend his free time playing on snow, dirt, rivers, and rocks and listening to geeky podcasts. Scott considers each day that he learns more than he forgets to be a success.',
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
      name: 'Justin Broglio',
      title: 'Advisory Board',
      start_date: null,
      biography:
        "\nJustin works as the Public Information Officer at the Desert Research Institute in Reno, NV. He has been involved with the SAC since 2005 and helped develop the online lift ticketing fundraising model used to sell, distribute and promote the SAC Ski & Ride Day Fundraiser lift tickets. His work on the board also includes procurement of several operational funding grants, vital community partner and sponsor relationships and a long-term relationship with the SAC's snowmobile partner company - Thin Air Motor Sports.\n\nAs an avid backcountry skier, snowmobiler and winter recreation enthusiast he has a strong passion for avalanche awareness to all user groups and unlimited, free access to the SAC advisory.\n\nJustin is also an annual contributor to Powder Magazine; director on the North Lake Tahoe Chamber of Commerce Advisory Board; public relations consultant for Alpengroup.org; and freelance journalist and social media consultant. He holds a Bachelor of Science in Natural Resource Ecology/Conservation Biology and a Minors in Journalism and Public Relations.",
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
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'James Brown',
      title: 'Director Emeritus',
      start_date: null,
      biography:
        "\nJames Brown, known as “JB” by his friends, passed away unexpectedly in May 2022. JB served on the Sierra Avalanche Center board for nearly a decade, including three years as president. An avid skier and climber, JB was an AMGA Certified Ski and Alpine Guide, co-owner of SWS Mountain Guides and California Ski Guides, and the 2007 recipient of REI’s Guide of the Year.\n\nJB is dearly missed by countless friends and family in our mountain community. He will be remembered not only for his incomparable backcountry skill, but also for his sarcastic wit, caring spirit, and generous heart. JB helped establish the Sierra Avalanche Center's scholarship program, which will be named in his memory.",
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Jonathan Laine',
      title: 'Director',
      start_date: null,
      biography:
        '\nJonathan has been backcountry skiing since the mid 1980s when he started telemarking, in the primitive days before “AT.” He has enjoyed the Sierra and lived in Truckee for the last 24 years, raising kids and adventuring. He was an active member of Tahoe Nordic Search and Rescue for many years, and believes that creating informed and educated backcountry users will create a safer backcountry experience, and get more people out to appreciate the beauty and exhilaration the mountains provide. He also brings business experience to SAC as previous President of a large medical corporation in Reno for 12 years and continues to work in the medical field in Truckee. \n\nJonathan enjoys cycling, nordic and backcountry skiing, backpacking and traveling. He spends his free time outside playing, and frequently caving in to his endorphin addiction.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'David Bunker',
      title: 'Director',
      start_date: null,
      biography:
        "David Bunker is a writer for The Abbi Agency, a digital communications firm with offices in Reno and Las Vegas. He is a former newspaper reporter and editor and an occasional freelance magazine writer.\n\nBorn and raised in California, David grew up backpacking through the Sierra Nevada and California's coastal mountains, and rock climbing in Pinnacles and Yosemite. After four years studying journalism inside the Beltway at the University of Maryland, he moved to Tahoe in 2003.\n\nWhen he finds time to get out from behind his desk, David splitboards, mountain bikes and provides comic relief for serious flyfishermen and trophy trout on the Truckee River by snarling his flyline in willow thickets for hours on end.\n\nDavid is a contributing editor to Moonshine Ink, and the recipient of awards from the National Newspaper Association, California Newspaper Publishers Association and the Nevada Press Association.",
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'David Fiore',
      title: 'Director',
      start_date: null,
      biography:
        'David has been an avid backcountry skier since moving out west in 1989.  He learned to telemark ski on Mt Lassen and Mt Shasta before moving to the Tahoe Basin and then Reno.  He teaches Wilderness Medicine to medical students, residents and practicing physician in various settings; with an emphasis on getting them "out there" using their skills.  In addition to back country skiing, David enjoys kayaking, rafting and cycling.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Jason Oelkers',
      title: 'Director',
      start_date: null,
      biography:
        'After graduating from the University of Wisconsin with a major in Psychology and Business, he moved out west and worked as a wilderness Instructor in Montana. Then migrated to San Francisco where he managed the Athlete and Expedition Department for The North Face.  With the Sierras in his backyard, he focused all of his free time rock/alpine climbing and backcountry snowboarding.  Eventually, he moved on to larger terrain giving up his job to travel and climb internationally.  Jason currently resides in Truckee, CA where he manages operations for an internet provider.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Todd Offenbacher',
      title: 'Director',
      start_date: null,
      biography:
        'Todd Offenbacher is an adventure climber, skier, and TV host for the Resorts Sports Network in Lake Tahoe. He has climbed first ascents around the world including 14 routes on El Captain in Yosemite, two with a disabled climber. He is a recipent of the Mugs Stump Award and the Lyman Spitzer Grant from the American Alpine Club. Todd skis the backcountry and local resorts during winters in Lake Tahoe. Todd has completed his AIARE Level 2 Avalanche training.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Sara Davidson',
      title: 'Director',
      start_date: null,
      biography:
        '\nSara is from Olympic Valley, California, and was first on skis at 18 months. Skiing has given Sara the opportunity to explore remote and far away zones, but she believes nothing compares to the beauty of the home range and its community of passionate skiers. \n\nSara sees sliding on snow as a lifelong gift, and she is committed to education and teaching the next generation. She has completed her AIARE Level 2 and has coached for kids’ ski and mountain bike programs.  \n\nWhen not in the skin track, on a trail, or bribing her kids with gummy bears and chocolate chip cookies to take “one more run,” Sara is an estate planning attorney at Truckee firm, Porter Simon. ',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Tasha Thomas',
      title: 'Director',
      start_date: null,
      biography:
        "\nTasha works for the Lake Tahoe Unified School District as a Physical Education Teacher. During all time in-between, she works for LTCC in Connect Education (coaching mountain biking workshops) and WEOL department (teaching Wilderness Navigation and AIARE courses, as well as several other courses). \n\nShe has been an outdoor enthusiast her entire life and began fulfilling her love for the outdoors in the Adirondacks and White Mountains on the eastern coast of the states. Her passion for rock climbing, mountain biking and exploring the larger mountain ranges led her to the Sierra Nevada's almost 15 years ago. Tasha's desire for recreating in bigger terrain has molded her to become passionate about Avalanche Education and the safety of others.\n\nHer top choice of winter excitement to satisfy the adrenaline is on her snowmobile which undoubtedly involves entering terrain with risk. She has a strong mission to uphold safety for those around her as well as herself. She is an Ambassador of Fun and is devoted to avalanche education and awareness for all group users of the back-country, especially in the motorized sector. Tasha is a Pro Level avalanche instructor and also one of Sierra Avalanche Center's Motorized Instructors.\n",
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Peter Stanton',
      title: 'Director',
      start_date: null,
      biography:
        'Peter Stanton brings experience in non-profit fundraising, leadership, and conservation to SAC. When not on the skin track, Peter leads the Walker Basin Conservancy’s efforts to restore Walker Lake in one of the largest watershed protection projects in North America. Winter typically finds him on the east side of the crest between Mount Rose and Tioga Pass. \n\nPeter is fortunate to have been introduced to the backcountry with strong mentorship, formal avalanche education and regular avalanche forecasts from Sierra Avalanche Center and ESAC. He is excited to contribute to keeping our community safe in the backcountry.\n\nPeter is a joyful husband and a rabid skier and ski tourer. He spends summers running in the mountains on trails and has completed multiple mountain ultramarathons.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Mark Bunge',
      title: 'Treasurer',
      start_date: null,
      biography:
        'Mark grew up skiing in the lowly Appalachians, addicted to Powder Magazine and Greg Stump films, and dreaming of a day when he could live and play out West. That dream came true in 2002 when he quit his job and drove from Maryland to Wyoming. Brimming with excitement and naive confidence, Mark charged into the Jackson Hole backcountry with little knowledge of avalanche terrain and no safety equipment whatsoever. He avoided serious consequences thanks to dumb (literally) luck alone.\n\nAfter moving to California, Mark wised up and belatedly began studying avalanche safety. He joined the Sierra Avalanche Center to help fellow Tahoe backcountry enthusiasts safely enjoy the amazing terrain that our area has to offer, avoid the bad choices he made, and come home safe due to smart, informed decision-making, not sheer luck.\n\nMark works as a political and market researcher, and spends his free time skiing, playing volleyball, rock climbing, and falling off his mountain bike.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Kerry Stendell',
      title: 'Secretary',
      start_date: null,
      biography:
        '\nKerry had to ditch the snowboard and switch back to skis when she and her then boyfriend, now husband, planned a three person, self-guided ascent of Denali in 2000. Twenty-three days on the mountain marked the beginning of a backcountry ski life. That, and moving back to California and the Sierra Nevada mountains after grad school sure helped.  Kerry has been able to enjoy the backcountry of Tahoe while the kids are in school and has been lucky enough to ski tour in Norway and the Alps of France, Switzerland, and Austria.  \n\nKerry is a volunteer National Ski Patrol at Alpine Meadows and is a searcher on the ski team for Tahoe Nordic Search and Rescue.  She is Level II AIARE certified and brings her skills of education, community outreach, and project management to the Sierra Avalanche Center.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Chris King',
      title: 'President',
      start_date: null,
      biography:
        'After growing up on the east coast, Chris and his wife Amy moved west in the 90’s and have been seeking adventure since – typically in various forms of skiing, cycling, and hiking. After 20 years in the Bay Area, the King family moved to Donner Summit full time, seizing the opportunity to be in the mountains year-round – and on skis a lot more. Professionally, Chris is a recovering marketing executive and currently advises start-ups – he still enjoys the process of helping tech companies and products grow from nothing to something. Chris also serves on the board of Sugar Bowl Ski Team and Academy – another outlet for his dual passions of mountain winters and education.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Jason Bilek',
      title: 'Professional Observer',
      start_date: null,
      biography:
        'After growing up in the mountain mecca of Illinois, Jason moved to Tahoe in 1995 to checkout the Sierra. He has been a heli guide in the Chugach since 2012 where he developed an appreciation for fast powder turns and the risks of backcountry travel. Jason also teached AIARE avalanche and rescue courses within the Tahoe region.  ',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'David Reichel',
      title: 'Executive Director',
      start_date: null,
      biography:
        'As soon as possible after UC Berkeley, David moved to the mountains. He took his first avalanche course that winter in the Rockies, and he’s been exploring snow covered peaks ever since. Back home in the Sierra he has taught about a bazillion AIARE courses and splitboarded all over Tahoe. David also guides and instructs avalanche courses in Mt. Shasta and Argentina. In 2014, he founded the California Avalanche Workshop. When not outside, David’s professional experience includes: starting a charter school for at risk young adults, running a college outdoor program, directing a small nonprofit, and working to get more kids on bikes. ',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Travis Feist',
      title: 'Education Coordinator',
      start_date: null,
      biography:
        "Travis is SAC's Education Coordinator, and has been a SAC Field Observer since 2010. He came to SAC after 15 seasons of professional ski patrolling, guiding, and avalanche instruction in North America, and 6 seasons of ski guiding and avalanche instruction in Argentina. Travis also spent several North American seasons traveling to teach AIARE Instructor Training Classes and Level 3s, and continues to teach AIARE Pro 1 and Pro 2 classes for motorized users. When not working for SAC, he teaches for the Wilderness Education and Outdoor Leadership program at Lake Tahoe Community College. On powder days you're most likely to find Travis on a snowmobile, though he still skis and insists he enjoys it.",
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Steve Reynaud',
      title: 'Forecaster',
      start_date: null,
      biography:
        'Steve started working for the Sierra Avalanche Center during the winter of 2006/2007 as a professional field observer and then as an avalanche forecaster in 2015.  He really enjoys being out in the mountains during big Sierra storm cycles conducting observation work.  Steve is also a local ski guide and a long time member of the Tahoe Nordic Search and Rescue Team.  He is a certified ski mountaineering guide with the American Mountain Guides Association and an avalanche educator through the American Institute of Avalanche Research and Education.  Steve lives in Truckee with his wife and family. ',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Brandon Schwartz',
      title: 'Forecaster',
      start_date: null,
      biography:
        'As Lead Forecaster, Brandon directs and oversees the avalanche forecasting and field observation portion of the the Tahoe National Forest Sierra Avalanche Center program. Brandon has been with the program since its inception in 2004. He comes with a background in multidisciplinary guiding, avalanche education, and wilderness emergency medicine instruction. Growing up in Colorado, attending college in Washington, and living in Idaho gave ample opportunity to see the many traits of snow in the Rockies, Cascades, and Tetons. He lives with his wife and son in Truckee.',
    },
    {
      tenant: tenants['sac'].id,
      photo: 1,
      name: 'Andy Anderson',
      title: 'Forecaster',
      start_date: null,
      biography:
        'Andy has been a forecaster at the Sierra Avalanche Center since 2006. Andy’s past forecasting experience comes from southeast Utah where the snow is light and shallow. In previous lives, Andy has been a ski patroller in the Northwest, an English teacher in Chile, a ski bum in the Tetons (funded by flipping burgers in Jackson Hole), a climbing ranger at Rocky Mountain and Mt. Rainier national parks, and a climbing guide. When not forecasting avalanches, he spends his time running long races and trying to keep up with his wife and son on the rocks and in the backcountry. Andy spends his summers teaching technical rescue classes and playing in the mountains.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: "Dennis D'Amico",
      title: 'Forecast Director',
      start_date: null,
      biography:
        'Dennis developed a passion for snow and weather while growing up in the not so mountainous Long Island, NY. He attended Cornell University in upstate New York and received a BS from the Atmospheric Science department. After a few seasons of dabbling in early backcountry ski adventures in New England & Eastern Canada, Dennis landed a weather forecasting position with the Seattle NWS in 2006. He was immediately drawn to the Northwest Avalanche Center’s unique DNA of mountain meteorology and snow science, and of course the easy access to the Olympics and Washington Cascades. Dennis was hired as an avalanche meteorologist for the Northwest Avalanche Center in 2012 and became the Forecast Director during the summer of 2019. He enjoys the challenge of forecasting weather and avalanche conditions during the season and working on and troubleshooting remote weather stations within the NWAC network throughout the year.\n\nWorking for NWAC has made Dennis appreciate all seasons, and in the forecasting offseason, you’ll find him relaxing and enjoying friends, family and his favorite pup.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Dallas Glass',
      title: 'Deputy Director',
      start_date: null,
      biography:
        'Dallas has worked at NWAC in several roles since 2013; avalanche awareness instructor, professional observer, and avalanche specialist. In 2020, Dallas began serving as NWAC’s Deputy Director. As part of this role, he works closely with NWAC’s educational program, mountain weather forecasting, and continues to write avalanche forecasts and perform field work for the Snoqualmie and West South zones.\n\nDallas loves talking to folks about snow. Whether it’s writing an avalanche forecast, interacting with a backcountry traveler, or teaching an avalanche awareness course, Dallas finds joy in seeing others safely experience the mountains during the winter.\n\nDallas has worked on avalanche forecasting, snow safety, and avalanche education since 2006. He served as a professional observer for NWAC, the professional training coordinator for the American Avalanche Association, an Instructor Trainer for the American Institute of Avalanche Research and Education (AIARE), and the avalanche forecaster for Mt Rose Ski Tahoe. His academic roots include a B.S. in Forest Resource Management from Clemson University and an M.S. in Hydrology from the University of Nevada where Dallas focused on soil physics, debris flows, and wilderness ecology. He is a professional member of the American Avalanche Association.\n\nWhen he isn’t working, you’ll find Dallas cooking at home, taking a long run, or seeking out warm sunny rock climbing.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Charlotte Guard',
      title: 'Product Manager',
      start_date: null,
      biography:
        'Charlotte has worked on the NWAC team since 2016. She oversees NWAC’s education and outreach efforts and the membership and donations programs\n\nIn her time at NWAC, Charlotte is excited about expanding the reach of the forecast and educational tools to include a larger and more diverse audience. She is also passionate about cultivating programs that draw together the collective experience and knowledge of the backcountry community.\n\nCharlotte brings her background in non-profit work and community outreach together with her affinity for ski touring and the Cascades. She holds a degree in International Studies from the University of Washington.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Cauri Hammer',
      title: 'Membership & Communications Coordinator',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Devon Schoos',
      title: 'Education Coordinator',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Liz Daniel',
      title: 'Development and Communications Manager',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Joe Dellaporta',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography: null,
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Irene Henninger',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography:
        'Irene joins NWAC after a long career in ski patrol and avalanche education. She spent 13 winters patrolling at the Yellowstone Club while working for 12 seasons at various ski areas in New Zealand, including several years as the Snow Safety Manager at The Remarkables, one of the largest ski areas in New Zealand. \n\nHer experience as an avalanche educator began in Montana in 2011 and has seen her teaching for a variety of organizations in Montana, New Zealand, and most recently, Utah, where she also worked as a ski guide in the Wasatch.\n\nIrene attended the National Avalanche School in 2008 and went on to receive her Avalanche Level 3 qualification and become an American Avalanche Association Certified Instructor, as well as becoming a New Zealand Mountain Safety Council Avalanche Instructor. \n\nPrior to her professional career, her passion for snow was sparked during her time as a cross-country ski racer and biathlete in the Northeast.  ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Katie Warren',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography:
        'Katie pursued a career in the snow and avalanche field to align her passions for science, the complex winter snowpack, and the striking beauty of winter. She completed a Master’s of Science in Geology using seismic equipment to monitor avalanche activity. After completing her graduate thesis, Katie spent the winter of 2013-2014 as an intern for the Chugach National Forest Avalanche Information Center. She has worked as a Ski Patroller at Stevens Pass since 2015 and enjoyed the extra responsibilities of developing in-house avalanche rescue training and assisting the avalanche forecasters set up for control missions. Since 2016 she’s been working as an on-call avalanche forecaster and control technician for the WSDOT avalanche crew for Stevens Pass, US HWY 2.  Eager to share her passion and help others recreate safely in the backcountry, Katie has been a recreational avalanche instructor for local providers since 2017. \n\nShe is also an advocate to professionals in the avalanche industry and has served as Executive Board Secretary for the American Avalanche Association since 2018. She is actively involved in Diversity, Equity, Inclusion, and Justice work and strives to be a voice for underrepresented individuals seeking careers or involvement in anything snow and avalanche-related.\n\nIn her spare time, you can find her adventuring in the mountains via bike, skis, or running shoes with her dog Nimbus hot in pursuit.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Andrew Harrington',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography:
        'After working a variety of jobs in multiple industries, Andy found the avalanche industry to be the most interesting and rewarding, He has worn multiple hats in the industry including ski patrol, highway forecasting and control, and now public forecasting. Additionally, his background in technology has helped him carve a niche working with our extensive weather station network. Andy is passionate about the backcountry in all seasons and keeping his environmental and digital footprint light. He also enjoys seeking out sustainable food sources and spending time in the kitchen.',
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
      name: 'Josh Hirshberg',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography:
        'Josh Hirshberg is an Avalanche Specialist who has worked at NWAC since January 2018. Josh is responsible for forecasting avalanches and gathering snow and avalanche observations for the Central Cascades including the Stevens Pass area.\n\nJosh believes in helping backcountry travelers make informed decisions in the snow-covered mountains. He is passionate about distilling snow, weather, and avalanche conditions into practical travel advice for all users.\n\nJosh holds a Level 3 Avalanche Certification. He’s also a Certified Ski Guide and Single Pitch Instructor with the American Mountain Guides Association. Josh has a B.A. from Prescott College. He is on the Pro Instructor and Trainer pools for the American institute for Avalanche Research and Education. Josh has been forecasting avalanches since 2005.\n\nWhen he’s not working in the snow, Josh enjoys climbing, biking, photography, spending time with his son, and supporting diverse communities.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Robert Hahn',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography:
        'Robert Hahn is an Avalanche Forecasting Meteorologist who has worked at NWAC since 2017. Robert is responsible for twice-daily mountain weather forecasts for all zones and daily avalanche forecasts for the Olympics, Mt. Hood, Washington Cascades East South, and other zones as needed, while helping to coordinate the avalanche products throughout the region.\n\nRobert believes that quality mountain weather and avalanche products will help backcountry travelers inform their decisions in the mountains, ultimately saving lives. Robert holds a master’s degree in Atmospheric Sciences from the University of Washington.\n\nWhen Robert is not working, you’ll find him backcountry skiing in remote corners of the Cascades or Canada and exploring tropical jungles when the snow melts.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Matt Primomo',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography:
        'Matt Primomo is an Avalanche Specialist who has worked at NWAC since 2017/18. Matt lives in Leavenworth and is responsible for writing the avalanche advisories for the East Central, East North, and Stevens Pass zones.\n\nMatt is intrigued by snow and its unique properties. He enjoys tracking the ever-changing snowpack, winter weather patterns, large avalanche cycles, weather station maintenance, and writing and teaching all about it. Previously he spent five years working as a year-round avalanche professional, maximizing his time spent in winter. Matt worked with the Utah Department of Transportation as an avalanche forecaster, while also directing an avalanche program for a small gold mine in Chile during the Southern Hemisphere Winter.\n\nMatt is a certified Ski Guide with the American Mountain Guide Association and a Pro Instructor with the American Institute for Avalanche Research and Education. He holds a bachelor’s degree in Geography from the University of Colorado, and an associate’s degree in Outdoor Recreation Leadership from Colorado Mountain College. In the summer he works as a mountain guide with the Northwest Mountain School, and Exum Mountain Guides. When he isn’t working you’ll find him enjoying the mountains with his wife, climbing, surfing, working on the house, sharpening snow saws for his company Primo Snow and Avalanche, or attempting to cook Italian food as well as the rest of his family.',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Lee Lazzara',
      title: 'Avalanche Forecaster',
      start_date: null,
      biography:
        'Lee Lazzara is an Avalanche Specialist based in Bellingham whose primary responsibilities are the West Slopes North and Central zones. Although new to NWAC as an Avalanche Specialist, Lee was a Professional Observer for this area from 2015 through 2020.\n\nOf all the aspects of snow, avalanches and backcountry travel in avalanche terrain, Lee finds observing and learning the nuances of the mountain environment the most fascinating. Why does it snow more on one side of the valley than the other? Why can snowpack change so drastically in a short distance across the same slope? How can minor differences in terrain choice have major implications for personal and group safety? Most importantly, how to communicate this information with others in a clear and consistent manner so they can use it in their own mountain travels?\n\nLee graduated from Seattle University in 1997 with a B.A. in English and quickly put his literary and writing skills to use skiing powder in Little Cottonwood Canyon. After nearly a decade of ski resort work including jobs, such as washing dishes in employee housing, shoveling snow, cleaning hot tubs, and not spilling wine on restaurant guests, he landed on the Snowbird Ski Patrol in 2005.  He began working as a mountain guide in the Cascades a few years later and gained IFMGA certification in 2013. ',
    },
    {
      tenant: tenants['nwac'].id,
      photo: 1,
      name: 'Simon Trautman',
      title: 'National Avalanche Specialist',
      start_date: null,
      biography:
        'Simon works for the National Avalanche Center and lives in Bellingham, Washington.  He has worked as an avalanche forecaster for the Moonlight Basin Ski Patrol, the Colorado Avalanche Information Center, the Sawtooth Avalanche Center, and the Northwest Avalanche Center.',
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
      if (name in users) {
        biographies[i].user = users[name].id
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
      alt: 'Lee Lazzara',
      filename: 'lee_lazzara.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Jason Oelkers',
      filename: 'jason_oelkers.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Sara Davidson',
      filename: 'sara_davidson.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Scott Schell',
      filename: 'scott_schell.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Phaedra Beckert',
      filename: 'phaedra_beckert.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Todd Offenbacher',
      filename: 'todd_offenbacher.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Katie Warren',
      filename: 'katie_warren.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Megan Stevenson',
      filename: 'megan_stevenson.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: "Dennis D'Amico",
      filename: 'dennis_damico.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Simon Trautman',
      filename: 'simon.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Erik Chelstad',
      filename: 'erik_chelstad.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Chris King',
      filename: 'chris_king.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Becca Cahall',
      filename: 'becca_cahal.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Liz Daniel',
      filename: 'liz_daniel.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Devon Schoos',
      filename: 'devon_schoos.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Travis Vandenburgh',
      filename: 'travis_vanderborough.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Tyler Ferris',
      filename: 'tyler_ferris.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Ethan Davis',
      filename: 'ethan_davis.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Angie Fidler',
      filename: 'angie_fidler.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Erin Zell',
      filename: 'erin_zell.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Hannah Marshall',
      filename: 'hannah_marhsall.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Mark Bunge',
      filename: 'mark_bunge.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Charlotte Guard',
      filename: 'charlotte_guard.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Olin Glenne',
      filename: 'olin_glenne.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Kerry Stendell',
      filename: 'kerry_stendell.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Travis Feist',
      filename: 'travis_feist.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Zachary Buzaid',
      filename: 'zachary_buzaid.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Josh Hirshberg',
      filename: 'josh_hirshberg.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Craig Shank',
      filename: 'craig_shank.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Irene Henninger',
      filename: 'irene_henninger.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Sarah Courtney',
      filename: 'sarah_courtney.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Jason Bilek',
      filename: 'jason_bilek.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Ryan Guess',
      filename: 'ryan_guess.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Brandon Schwartz',
      filename: 'brandon_schwartz.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Andy Anderson',
      filename: 'andy_anderson.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Jon Ferrian',
      filename: 'jon_ferrian.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'David Gorton',
      filename: 'david_gorton.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'David Reichel',
      filename: 'david_reichel.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Berger Dodge',
      filename: 'berger_dodge.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Ashley Hartz',
      filename: 'ashley_hartz.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Roland Emetaz',
      filename: 'roland_emetaz.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Annie DeAngelo',
      filename: 'annie_deangelo.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Cauri Hammer',
      filename: 'cauri_hammer.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Steve Butler',
      filename: 'steve_butler.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Heather Karell',
      filename: 'heather_karell.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Chris Potts',
      filename: 'chris_potts.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'David Fiore',
      filename: 'david_fiore.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Tyler Frisbee',
      filename: 'tyler_frisbee.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Louise Stumph',
      filename: 'louise_stumph.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Kelsey Noonan',
      filename: 'kelsey_noonan.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Gavin Woody',
      filename: 'gavin_woody.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Chris Lundy',
      filename: 'chris_lundy.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Peter Stanton',
      filename: 'peter_stanton.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Lewis Turner',
      filename: 'lewis_turner.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Tasha Thomas',
      filename: 'tasha_thomas.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'James Brown',
      filename: 'jb_james_brown.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Arun Jacob',
      filename: 'arun_jacob.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Matt Primomo',
      filename: 'matt_primomo.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Steve Reynaud',
      filename: 'steve_reynaud.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Kendall Stever',
      filename: 'kendall_stever.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Joe Dellaporta',
      filename: 'joe_dellaporta.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Jonathan Laine',
      filename: 'jonathan_laine.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'David Bunker',
      filename: 'david_bunker.webp',
      tenant: tenants['sac'],
    },
    {
      alt: 'Scott Savage',
      filename: 'scott_savage.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Dallas Glass',
      filename: 'dallas_glass.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Brooke Maushund',
      filename: 'brooke_mashound.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Andrew Harrington',
      filename: 'andrew_harrington.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Dawn Bird',
      filename: 'dawn_bird.webp',
      tenant: tenants['snfac'],
    },
    {
      alt: 'Michael Manuel',
      filename: 'michael_manuel.webp',
      tenant: tenants['nwac'],
    },
    {
      alt: 'Robert Hahn',
      filename: 'robert_hahn.webp',
      tenant: tenants['nwac'],
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
      tenant: tenants['nwac'].id,
      name: 'USFS Forecast Staff',
      members: [
        bios['nwac']["Dennis D'Amico"].id,
        bios['nwac']['Dallas Glass'].id,
        bios['nwac']['Andrew Harrington'].id,
        bios['nwac']['Irene Henninger'].id,
        bios['nwac']['Joe Dellaporta'].id,
        bios['nwac']['Josh Hirshberg'].id,
        bios['nwac']['Katie Warren'].id,
        bios['nwac']['Lee Lazzara'].id,
        bios['nwac']['Matt Primomo'].id,
        bios['nwac']['Robert Hahn'].id,
        bios['nwac']['Simon Trautman'].id,
      ],
    },
    {
      tenant: tenants['nwac'].id,
      name: 'Non-Profit Staff',
      members: [
        bios['nwac']['Scott Schell'].id,
        bios['nwac']['Charlotte Guard'].id,
        bios['nwac']['Liz Daniel'].id,
        bios['nwac']['Devon Schoos'].id,
        bios['nwac']['Cauri Hammer'].id,
      ],
    },
    {
      tenant: tenants['nwac'].id,
      name: 'Non-Profit Board of Directors Officers',
      members: [
        bios['nwac']['Gavin Woody'].id,
        bios['nwac']['Arun Jacob'].id,
        bios['nwac']['Kelsey Noonan'].id,
        bios['nwac']['Kendall Stever'].id,
      ],
    },
    {
      tenant: tenants['nwac'].id,
      name: 'Non-Profit Board Of Directors',
      members: [
        bios['nwac']['Erik Chelstad'].id,
        bios['nwac']['Jon Ferrian'].id,
        bios['nwac']['Heather Karell'].id,
        bios['nwac']['Sarah Courtney'].id,
        bios['nwac']['David Gorton'].id,
        bios['nwac']['Berger Dodge'].id,
        bios['nwac']['Zachary Buzaid'].id,
        bios['nwac']['Michael Manuel'].id,
        bios['nwac']['Phaedra Beckert'].id,
        bios['nwac']['Ashley Hartz'].id,
        bios['nwac']['Angie Fidler'].id,
        bios['nwac']['Becca Cahall'].id,
        bios['nwac']['Craig Shank'].id,
        bios['nwac']['Chris Potts'].id,
        bios['nwac']['Tyler Frisbee'].id,
      ],
    },
    {
      tenant: tenants['nwac'].id,
      name: 'Emeritus Non-Profit Board Members',
      members: [bios['nwac']['Roland Emetaz'].id, bios['nwac']['Lewis Turner'].id],
    },

    {
      tenant: tenants['snfac'].id,
      name: 'Forecasters',
      members: [
        bios['snfac']['Scott Savage'].id,
        bios['snfac']['Ethan Davis'].id,
        bios['snfac']['Brooke Maushund'].id,
        bios['snfac']['Chris Lundy'].id,
      ],
    },
    {
      tenant: tenants['snfac'].id,
      name: 'Non-Profit Staff',
      members: [
        bios['snfac']['Hannah Marshall'].id,
        bios['snfac']['Dawn Bird'].id,
        bios['snfac']['Annie DeAngelo'].id,
      ],
    },
    {
      tenant: tenants['snfac'].id,
      name: 'Non-Profit Board of Directors',
      members: [
        bios['snfac']['Ryan Guess'].id,
        bios['snfac']['Travis Vandenburgh'].id,
        bios['snfac']['Steve Butler'].id,
        bios['snfac']['Erin Zell'].id,
        bios['snfac']['Megan Stevenson'].id,
        bios['snfac']['Tyler Ferris'].id,
        bios['snfac']['Olin Glenne'].id,
        bios['snfac']['Louise Stumph'].id,
      ],
    },

    {
      tenant: tenants['sac'].id,
      name: 'Forecasters',
      members: [
        bios['sac']['Andy Anderson'].id,
        bios['sac']['Brandon Schwartz'].id,
        bios['sac']['Steve Reynaud'].id,
      ],
    },
    {
      tenant: tenants['sac'].id,
      name: 'Professional Observers',
      members: [
        bios['sac']['Travis Feist'].id,
        bios['sac']['David Reichel'].id,
        bios['sac']['Jason Bilek'].id,
      ],
    },
    {
      tenant: tenants['sac'].id,
      name: 'Non-Profit Staff',
      members: [bios['sac']['David Reichel'].id, bios['sac']['Travis Feist'].id],
    },
    {
      tenant: tenants['sac'].id,
      name: 'Non-Profit Board of Directors',
      members: [
        bios['sac']['Chris King'].id,
        bios['sac']['Kerry Stendell'].id,
        bios['sac']['Mark Bunge'].id,
        bios['sac']['Peter Stanton'].id,
        bios['sac']['Tasha Thomas'].id,
        bios['sac']['Sara Davidson'].id,
        bios['sac']['Todd Offenbacher'].id,
        bios['sac']['Jason Oelkers'].id,
        bios['sac']['David Fiore'].id,
        bios['sac']['David Bunker'].id,
        bios['sac']['Jonathan Laine'].id,
        bios['sac']['James Brown'].id,
      ],
    },
    {
      tenant: tenants['sac'].id,
      name: 'Advisory Board',
      members: [
        bios['sac']['John Swanson'].id,
        bios['sac']['Justin Broglio'].id,
        bios['sac']['Bob Moore'].id,
        bios['sac']['Neil Morse'].id,
        bios['sac']['Holly Yocum'].id,
      ],
    },
  ]

  return teams
}
