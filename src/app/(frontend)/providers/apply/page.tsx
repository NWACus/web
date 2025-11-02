'use client'

import { stateOptions } from '@/blocks/Form/State/options'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea as TextareaUi } from '@/components/ui/textarea'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitProviderApplication, type ProviderApplicationData } from './actions'

const courseTypeOptions = [
  { label: 'Rec 1', value: 'rec-1', description: 'Introduction to avalanche safety' },
  { label: 'Rec 2', value: 'rec-2', description: 'Advanced avalanche course' },
  { label: 'Pro 1', value: 'pro-1', description: 'Entry-level professional training' },
  { label: 'Pro 2', value: 'pro-2', description: 'Advanced professional course' },
  { label: 'Rescue', value: 'rescue', description: 'Companion rescue training' },
  {
    label: 'Awareness',
    value: 'awareness-external',
    description: 'Introductory avalanche awareness',
  },
]

export default function ProviderApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      details: '',
      email: '',
      phone: '',
      website: '',
      experience: '',
      placeName: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      extraInfo: '',
    },
  })

  const selectedState = watch('state')

  const onSubmit = async (data: Record<string, unknown>) => {
    if (selectedCourseTypes.length === 0) {
      setSubmitError('Please select at least one course type')
      return
    }

    if (!selectedState) {
      setSubmitError('Please select a state')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const applicationData: ProviderApplicationData = {
        ...data,
        courseTypes: selectedCourseTypes,
        state: selectedState,
      } as ProviderApplicationData

      const result = await submitProviderApplication(applicationData)

      if (result.success) {
        setSubmitSuccess(true)
        reset()
        setSelectedCourseTypes([])
      } else {
        setSubmitError(result.error)
      }
    } catch (_error) {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-lg border border-green-500 bg-green-50 p-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-green-800">Application Submitted!</h1>
          <p className="mb-4 text-lg text-green-700">
            Thank you for applying to be a listed provider on AvyFx.
          </p>
          <p className="mb-6 text-green-600">
            We have received your application and will review it shortly. You should receive a
            confirmation email at the address you provided.
          </p>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/providers">View Provider Listings</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Apply to Be a Listed Provider</h1>
        <p className="text-lg text-gray-600">
          Fill out the form below to apply to have your organization listed as an avalanche
          education provider on AvyFx. We&apos;ll review your application and get back to you within
          3-5 business days.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Public Listing Information */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-6 text-2xl font-semibold">Public Listing Information</h2>

          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Organization Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" {...register('name', { required: true })} className="text-black" />
                {errors.name && <p className="mt-1 text-sm text-red-600">This field is required</p>}
              </div>
              <div>
                <Label htmlFor="details">
                  Organization Description <span className="text-red-500">*</span>
                </Label>
                <TextareaUi
                  id="details"
                  {...register('details', { required: true })}
                  rows={5}
                  className="text-black"
                />
                {errors.details && (
                  <p className="mt-1 text-sm text-red-600">This field is required</p>
                )}
              </div>
            </div>
          </div>

          {/* Course Types */}
          <div className="mb-8">
            <h3 className="mb-2 text-lg font-medium">
              Course Types <span className="text-red-500">*</span>
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              Select all course types your organization is equipped to provide
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {courseTypeOptions.map((option) => {
                const isSelected = selectedCourseTypes.includes(option.value)

                return (
                  <label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={option.value}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCourseTypes([...selectedCourseTypes, option.value])
                        } else {
                          setSelectedCourseTypes(
                            selectedCourseTypes.filter((type) => type !== option.value),
                          )
                        }
                      }}
                    />
                    <div className="font-medium leading-none">{option.label}</div>
                  </label>
                )
              })}
            </div>
            {selectedCourseTypes.length === 0 && submitError && (
              <p className="mt-2 text-sm text-red-600">Please select at least one course type</p>
            )}
          </div>

          {/* Location */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium">Location</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" {...register('address')} className="text-black" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} className="text-black" />
                </div>
                <div>
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedState || ''}
                    onValueChange={(value) => setValue('state', value)}
                  >
                    <SelectTrigger className="text-black">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedState && errors.state && (
                    <p className="mt-1 text-sm text-red-600">This field is required</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" {...register('zip')} className="text-black" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="mb-4 text-lg font-medium">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { required: true, pattern: /^\S[^\s@]*@\S+$/ })}
                  className="text-black"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">Valid email is required</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone', {
                      pattern: {
                        value:
                          /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
                        message:
                          'Phone number must be valid (e.g., (123) 456-7890, 123-456-7890, or 1234567890)',
                      },
                    })}
                    className="text-black"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    {...register('website', {
                      validate: (value) => {
                        if (!value) return true
                        try {
                          const url = new URL(value)
                          return (
                            url.protocol !== '' ||
                            'URL must be an absolute url with a protocol (e.g., https://www.example.com)'
                          )
                        } catch {
                          return 'URL must be an absolute url with a protocol (e.g., https://www.example.com)'
                        }
                      },
                    })}
                    className="text-black"
                  />
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Application Information */}
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-6 text-2xl font-semibold">Application Information</h2>

          {/* Experience & Certifications */}
          <div>
            <h3 className="mb-4 text-lg font-medium">Experience & Certifications</h3>
            <div>
              <Label htmlFor="experience">
                Please describe your organization&apos;s experience, instructor certifications, and
                qualifications
              </Label>
              <TextareaUi
                id="experience"
                {...register('experience')}
                rows={6}
                className="text-black"
                placeholder="Tell us about your experience, certifications (AIARE, etc.), years in operation, notable achievements..."
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        {submitError && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset()
              setSelectedCourseTypes([])
              setSubmitError(null)
            }}
          >
            Clear Form
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  )
}
