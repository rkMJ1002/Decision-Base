class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-slate-600 mb-4">We encountered an unexpected error.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-slate-800 text-white rounded-lg"
          >
            Reload App
          </button>
          <details className="mt-4 text-left text-xs text-slate-400 bg-slate-100 p-2 rounded overflow-auto">
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
    try {
        const [view, setView] = React.useState('loading'); // loading, onboarding, home, new-decision, analysis, result, history, settings
        const [userProfile, setUserProfile] = React.useState(null);
        const [currentDecision, setCurrentDecision] = React.useState(null);
        const [alert, setAlert] = React.useState(null);
        const [theme, setTheme] = React.useState('light');

        React.useEffect(() => {
            // Load Profile
            const profile = Storage.getProfile();
            if (profile) {
                setUserProfile(profile);
                setView('home');
            } else {
                setView('onboarding');
            }

            // Load Theme
            const savedTheme = Storage.getTheme();
            setTheme(savedTheme);
        }, []);

        React.useEffect(() => {
            // Apply Theme
            const root = document.documentElement;
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            Storage.saveTheme(theme);
        }, [theme]);

        const toggleTheme = () => {
            setTheme(prev => prev === 'light' ? 'dark' : 'light');
        };

        const handleOnboardingComplete = (profile) => {
            Storage.saveProfile(profile);
            setUserProfile(profile);
            setView('home');
        };

        const showAlert = (msg, type = 'info') => {
            setAlert({ message: msg, type });
        };

        const renderView = () => {
            switch (view) {
                case 'loading':
                    return (
                        <div className="h-screen flex items-center justify-center">
                            <div className="icon-loader animate-spin text-2xl text-slate-400"></div>
                        </div>
                    );
                case 'onboarding':
                    return <Onboarding onComplete={handleOnboardingComplete} />;
                case 'home':
                    return <Home userProfile={userProfile} onNavigate={setView} />;
                case 'new-decision':
                    return (
                        <DecisionForm 
                            onBack={() => setView('home')} 
                            onAnalyze={(data) => {
                                setCurrentDecision(data);
                                setView('result');
                            }}
                            userProfile={userProfile}
                            onError={(msg) => showAlert(msg, 'error')}
                        />
                    );
                case 'result':
                    return (
                        <AnalysisResult 
                            decisionData={currentDecision}
                            onBack={() => setView('home')}
                            onSave={() => setView('home')} 
                            userProfile={userProfile}
                        />
                    );
                case 'history':
                    return <History onBack={() => setView('home')} onNavigate={setView} />;
                case 'settings':
                    return (
                        <Settings 
                            onBack={() => setView('home')} 
                            theme={theme}
                            onToggleTheme={toggleTheme}
                        />
                    );
                default:
                    return <Home userProfile={userProfile} onNavigate={setView} />;
            }
        };

        return (
            <Layout currentView={view} onNavigate={setView}>
                {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
                {renderView()}
            </Layout>
        );
    } catch (error) {
        console.error('App component error:', error);
        return <div className="p-4 text-red-500">Critical Error: {error.message}</div>;
    }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
