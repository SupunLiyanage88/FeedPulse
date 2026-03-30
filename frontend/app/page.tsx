import FeedbackForm from './components/FeedbackForm';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FeedPulse</h1>
              <p className="text-gray-600 mt-1">Your voice matters to us</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Share Your Feedback</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    We're constantly improving FeedPulse. Your feedback helps us understand what's working and what needs improvement.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">No Account Needed</p>
                      <p className="text-gray-600 text-xs">Anonymous submissions welcome</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">⚡</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">AI-Powered Analysis</p>
                      <p className="text-gray-600 text-xs">Smart categorization of feedback</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-bold">🔒</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Privacy Focused</p>
                      <p className="text-gray-600 text-xs">Your data is secure with us</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <strong>Rate Limit:</strong> 5 submissions per hour per device to maintain quality and prevent spam.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <FeedbackForm />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2024 FeedPulse. We appreciate every piece of feedback.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
