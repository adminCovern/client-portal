const React = require('react');
const ReactDOM = require('react-dom');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
  </div>
);

// Error toast component
const ErrorToast = ({ message, onClose }) => (
  <div className="fixed top-4 right-4 bg-red-800 text-white p-4 rounded-lg shadow-lg">
    <p>{message}</p>
    <button onClick={onClose} className="ml-2 text-red-400">×</button>
  </div>
);

const ClientPortal = () => {
  const [session, setSession] = React.useState(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [assets, setAssets] = React.useState([]);
  const [subscriptionLevel, setSubscriptionLevel] = React.useState('Premium');
  const [feedbackText, setFeedbackText] = React.useState('');
  const [feedbackHistory, setFeedbackHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newAssetType, setNewAssetType] = React.useState('');

  React.useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) setError(error.message);
      setSession(session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (session) {
      fetchData();
      subscribeToChanges();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*');
      if (assetsError) throw assetsError;
      setAssets(assetsData || []);

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('intelligence')
        .select('*')
        .order('created_at', { ascending: false });
      if (feedbackError) throw feedbackError;
      setFeedbackHistory(feedbackData || []);

      // Fetch subscription level from user metadata or separate table; default to 'Premium'
      setSubscriptionLevel('Premium');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData())
      .subscribe();

    supabase
      .channel('assets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => fetchData())
      .subscribe();

    supabase
      .channel('feedback-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'intelligence' }, (payload) => {
        setFeedbackHistory((prev) => [payload.new, ...prev]);
      })
      .subscribe();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Email and Password are required');
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      setSession(data.session);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email || !password || password !== confirmPassword) {
        throw new Error('Email, Password, and confirmation are required and must match');
      }
      const { data, error: regError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (regError) throw regError;
      setError('Registration successful. Please check your email for verification.');
      setIsRegistering(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    setSession(null);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText) return;
    try {
      const { error } = await supabase
        .from('intelligence')
        .insert({ text: feedbackText, user_id: session.user.id });
      if (error) throw error;
      setFeedbackText('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      const { error } = await supabase
        .from('projects')
        .insert({ name: newProjectName, user_id: session.user.id, status: 'active' });
      if (error) throw error;
      setNewProjectName('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!newAssetType) return;
    try {
      const { error } = await supabase
        .from('assets')
        .insert({ type: newAssetType, user_id: session.user.id, value: {} });
      if (error) throw error;
      setNewAssetType('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border-2 border-cyan-500 w-full max-w-md augmented-ui flicker" augmented-ui="tl-clip br-clip border">
          <h1 className="text-3xl font-bold text-cyan-400 text-center mb-6 neon glitch">Covren Firm Client Portal</h1>
          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded mt-1 border-glow"
                  placeholder="your@business.com"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded mt-1 border-glow"
                  placeholder="********"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded mt-1 border-glow"
                  placeholder="********"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded mt-4 transition duration-300 neon-glow">
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-cyan-400 mt-2">Back to Login</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded mt-1 border-glow"
                  placeholder="your@business.com"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded mt-1 border-glow"
                  placeholder="********"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded mt-4 transition duration-300 neon-glow">
                {loading ? 'Logging In...' : 'Login'}
              </button>
              <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-cyan-400 mt-2">Create Account</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      <header className="p-6 border-b border-cyan-500">
        <h1 className="text-4xl font-bold text-cyan-400 neon glitch">Covren Firm Dashboard</h1>
        <p className="text-gray-400">Systems Optimized for Your Business</p>
      </header>
      {loading ? <LoadingSpinner /> : (
        <main className="flex-grow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg col-span-1 md:col-span-2 augmented-ui" augmented-ui="tl-clip br-clip border">
            <h2 className="text-xl text-cyan-300">Subscription Level</h2>
            <p className="text-2xl font-bold text-cyan-400 neon">{subscriptionLevel}</p>
            <button onClick={handleLogout} className="mt-4 bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded transition duration-300 neon-glow">Logout</button>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg transition transform hover:scale-105 augmented-ui" augmented-ui="tl-clip br-clip border">
            <h2 className="text-xl text-cyan-300">Your AI Projects ({projects.length})</h2>
            <ul className="space-y-2 mt-2">
              {projects.map((proj) => (
                <li key={proj.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span>{proj.name} - {proj.status}</span>
                  <button onClick={() => handleDeleteProject(proj.id)} className="text-red-400">Delete</button>
                </li>
              ))}
            </ul>
            <form onSubmit={handleCreateProject} className="mt-4">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border-glow"
                placeholder="New Project Name"
              />
              <button type="submit" className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded transition duration-300 neon-glow">Create Project</button>
            </form>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg transition transform hover:scale-105 augmented-ui" augmented-ui="tl-clip br-clip border">
            <h2 className="text-xl text-cyan-300">Your Digital Assets ({assets.length})</h2>
            <ul className="space-y-2 mt-2">
              {assets.map((asset) => (
                <li key={asset.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                  <span>{asset.type}</span>
                  <button onClick={() => handleDeleteAsset(asset.id)} className="text-red-400">Delete</button>
                </li>
              ))}
            </ul>
            <form onSubmit={handleCreateAsset} className="mt-4">
              <input
                type="text"
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border-glow"
                placeholder="New Asset Type"
              />
              <button type="submit" className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded transition duration-300 neon-glow">Create Asset</button>
            </form>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg col-span-1 md:col-span-2 augmented-ui" augmented-ui="tl-clip br-clip border">
            <h2 className="text-xl text-cyan-300 mb-4">Submit Feedback</h2>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded h-32 border-glow"
                placeholder="Provide your feedback or suggestions..."
              />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded transition duration-300 neon-glow">Send Feedback</button>
            </form>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg col-span-1 md:col-span-2 augmented-ui" augmented-ui="tl-clip br-clip border">
            <h2 className="text-xl text-cyan-300 mb-4">Feedback History</h2>
            <ul className="space-y-2">
              {feedbackHistory.map((fb) => (
                <li key={fb.id} className="bg-gray-700 p-3 rounded border-glow">
                  <p className="text-gray-300 text-sm">{new Date(fb.created_at).toLocaleString()}</p>
                  <p>{fb.text}</p>
                </li>
              ))}
              {feedbackHistory.length === 0 && <p className="text-gray-400">No feedback submitted yet.</p>}
            </ul>
          </div>
        </main>
      )}
    </div>
  );
};

ReactDOM.render(<ClientPortal />, document.getElementById('root'));