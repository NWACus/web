export default function PostSkeleton({ count = 5 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="animate-pulse flex flex-col md:flex-row py-4">
          <div className="h-48 w-1/2 mr-6 bg-gray-200 rounded" /> {/* Image */}
          <div className="flex flex-col gap-2 w-1/2 mt-2">
            <div className="h-12 w-12 bg-gray-200 rounded-full" /> {/* Author */}
            <div className="h-8 w-1/3 bg-gray-300 rounded" /> {/* Title */}
            <div className="h-4 w-1/4 bg-gray-200 rounded" /> {/* Meta */}
            <div className="h-4 w-full bg-gray-200 rounded" /> {/* Short desc */}
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
