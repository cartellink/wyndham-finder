import SearchForm from '@/components/SearchForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Search All Club<br />
            Wyndham South Pacific<br />
            Resorts
          </h1>
          <p className="text-xl text-gray-600">
            Real-time availability across all Club Wyndham SP resorts
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <SearchForm />
        </div>
      </div>
    </main>
  )
}
