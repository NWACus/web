import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { upsertGlobals } from './upsert'

export const seedProviders = async (payload: Payload, incremental: boolean): Promise<void> => {
  const providers: RequiredDataFromCollectionSlug<'providers'>[] = [
    {
      name: 'Alpine Skills International',
      slug: 'alpine-skills-international',
      details:
        'Alpine Skills International (ASI) is a premier avalanche education provider offering comprehensive training from recreational to professional levels. Our experienced instructors bring real-world mountain experience to every course.',
      location: {
        address: '123 Mountain View Drive',
        city: 'Tahoe City',
        state: 'CA',
        zip: '96145',
        country: 'US',
      },
      courseTypes: ['rec-1', 'rec-2', 'pro-1', 'pro-2'],
      _status: 'published',
    },
    {
      name: 'Mountain Education Center',
      slug: 'mountain-education-center',
      details:
        'The Mountain Education Center specializes in avalanche awareness and rescue training for backcountry enthusiasts. We focus on practical, hands-on learning that prepares students for real mountain situations.',
      location: {
        address: '456 Cascade Loop',
        city: 'Leavenworth',
        state: 'WA',
        zip: '98826',
        country: 'US',
      },
      courseTypes: ['rec-1', 'rec-2', 'rescue'],
      _status: 'published',
    },
    {
      name: 'Backcountry Alliance',
      slug: 'backcountry-alliance',
      details:
        'Backcountry Alliance is dedicated to making avalanche education accessible to everyone. We offer free awareness courses and affordable rescue training to build a safer backcountry community.',
      location: {
        address: '789 Summit Street',
        city: 'Durango',
        state: 'CO',
        zip: '81301',
        country: 'US',
      },
      courseTypes: ['awareness-external', 'rescue'],
      _status: 'published',
    },
    {
      name: 'Pro Avalanche Training',
      slug: 'pro-avalanche-training',
      details:
        'Pro Avalanche Training delivers advanced professional-level courses for ski patrol, guides, and avalanche professionals. Our curriculum meets industry standards and exceeds expectations.',
      location: {
        address: '321 Powder Boulevard',
        city: 'Jackson',
        state: 'WY',
        zip: '83001',
        country: 'US',
      },
      courseTypes: ['pro-1', 'pro-2'],
      _status: 'published',
    },
  ]

  await upsertGlobals('providers', payload, incremental, (obj) => obj.name, providers)
}
