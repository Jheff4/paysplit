import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { imageFileProblem, kycApi, KYC_MAX_BYTES, type KycStatus } from './api'
import { StepHeading } from './StepHeading'

type Shot = { blob: Blob; url: string }

export function LivenessStep({ status, onApproved }: { status: KycStatus; onApproved: () => void }) {
  const queryClient = useQueryClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string>()
  const [shot, setShot] = useState<Shot>()

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])
  useEffect(() => () => (shot ? URL.revokeObjectURL(shot.url) : undefined), [shot])

  async function startCamera() {
    setCameraError(undefined)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Your browser cannot use the camera here. Upload a selfie instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      setCameraOn(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })
    } catch {
      setCameraError('We could not use your camera. Allow camera access in your browser settings, or upload a selfie instead.')
    }
  }

  function takeShot() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1280 / video.videoWidth)
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        if (blob.size > KYC_MAX_BYTES) {
          setCameraError('That photo is too large. Try again in better light.')
          return
        }
        stopCamera()
        setShot({ blob, url: URL.createObjectURL(blob) })
      },
      'image/jpeg',
      0.85,
    )
  }

  const submit = useMutation({
    mutationFn: (blob: Blob) => kycApi.liveness(blob),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kyc'] })
      onApproved()
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ['kyc'] }),
  })

  const { attemptsRemaining, failureReason } = status.steps.liveness

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        title="Biometric Liveness Verification"
        description="Ensure you are in good lighting. Look directly into the camera frame."
      />

      {failureReason && !submit.isError && (
        <Alert tone="warning" title="Your last attempt did not pass">
          {failureReason}
        </Alert>
      )}
      {submit.isError && (
        <Alert tone="error" live>
          {errorMessage(submit.error)} You have {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} left.
        </Alert>
      )}
      {cameraError && (
        <Alert tone="warning" live>
          {cameraError}
        </Alert>
      )}

      <div className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[20px] bg-chip">
        {shot ? (
          <img src={shot.url} alt="Your selfie" className="size-full object-cover" />
        ) : cameraOn ? (
          <video ref={videoRef} playsInline muted aria-label="Camera preview" className="size-full -scale-x-100 object-cover" />
        ) : (
          <Camera aria-hidden="true" className="size-12 text-muted" />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 aspect-[3/4] h-3/4 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 border-brand shadow-[0_0_0_9999px_rgb(0_0_0/0.25)]"
        />
      </div>
      <p className="text-center text-sm text-muted">Position your face inside the oval.</p>

      {shot ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => {
              setShot(undefined)
              void startCamera()
            }}
          >
            <RotateCcw aria-hidden="true" className="size-5" />
            Retake
          </Button>
          <Button size="lg" className="flex-1" loading={submit.isPending} onClick={() => submit.mutate(shot.blob)}>
            Use this photo
          </Button>
        </div>
      ) : cameraOn ? (
        <Button size="lg" className="w-full" onClick={takeShot}>
          Take shot
        </Button>
      ) : (
        <Button size="lg" className="w-full" onClick={() => void startCamera()} disabled={attemptsRemaining === 0}>
          Turn on camera
        </Button>
      )}

      {!shot && (
        <label className="text-center text-sm text-muted">
          No camera?{' '}
          <span className="cursor-pointer font-medium text-link underline underline-offset-4">Upload a selfie instead</span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            capture="user"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              const problem = imageFileProblem(file, true)
              if (problem || !file) {
                setCameraError(problem ?? undefined)
                return
              }
              stopCamera()
              setShot({ blob: file, url: URL.createObjectURL(file) })
            }}
          />
        </label>
      )}
    </div>
  )
}
