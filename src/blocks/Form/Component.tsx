'use client'

import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React, { useCallback, useId, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { FormBlock as FormBlockType } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import { getURL } from '@/utilities/getURL'
import { isValidRelationship } from '@/utilities/relationships'
import { getHostnameFromTenant } from '@/utilities/tenancy/getHostnameFromTenant'
import { cn } from '@/utilities/ui'
import { buildInitialFormState } from './buildInitialFormState'
import { fields } from './fields'

export type Value = unknown

export interface Property {
  [key: string]: Value
}

export interface Data {
  [key: string]: Property | Property[]
}

type FormBlockTypeProps = { isLayoutBlock?: boolean } & FormBlockType

export const FormBlockComponent = (props: FormBlockTypeProps) => {
  const { enableIntro, introContent, isLayoutBlock = true } = props

  const uniqueFormId = useId()

  // Validate form has fields before initializing, use empty array as fallback for hooks
  const formFields = isValidRelationship(props.form) && props.form.fields ? props.form.fields : []

  const formMethods = useForm({
    /* @ts-expect-error this code is inherited from Payload and is full of type errors, we should fix it later */
    defaultValues: buildInitialFormState(formFields),
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  const { tenant } = useTenant()
  const hostname = getHostnameFromTenant(tenant)

  const onSubmit = useCallback(
    (data: Data) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          if (typeof props.form !== 'object') {
            return
          }
          const req = await fetch(`${getURL(hostname)}/api/form-submissions`, {
            body: JSON.stringify({
              form: props.form.id,
              submissionData: dataToSend,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || 'Internal Server Error',
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (props.form.confirmationType === 'redirect' && props.form.redirect) {
            const { url } = props.form.redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [props.form, hostname, router],
  )

  if (!isValidRelationship(props.form) || !props.form.fields) {
    return null
  }

  return (
    <div className={cn('lg:max-w-[48rem]', isLayoutBlock && 'container')}>
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}
      <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
        <FormProvider {...formMethods}>
          {!isLoading &&
            hasSubmitted &&
            props.form.confirmationType === 'message' &&
            props.form.confirmationMessage && <RichText data={props.form.confirmationMessage} />}
          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
          {error && <div>{`${error.status || '500'}: ${error.message || ''}`}</div>}
          {!hasSubmitted && (
            /* @ts-expect-error this code is inherited from Payload and is full of type errors, we should fix it later */
            <form id={uniqueFormId} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {props.form &&
                  props.form.fields &&
                  props.form.fields?.map((field, index) => {
                    /* @ts-expect-error this code is inherited from Payload and is full of type errors, we should fix it later */
                    const Field: React.FC<unknown> = fields?.[field.blockType]
                    if (Field) {
                      return (
                        <div className="mb-6 last:mb-0" key={`${field.id}-${index}`}>
                          <Field
                            form={props.form}
                            {...field}
                            {...formMethods}
                            // @ts-expect-error there's something imprecise about this `Field` abstraction, tsc says there's no control prop
                            control={control}
                            errors={errors}
                            register={register}
                          />
                        </div>
                      )
                    }
                    return null
                  })}
              </div>

              <Button form={uniqueFormId} type="submit" variant="default">
                {props.form.submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}
