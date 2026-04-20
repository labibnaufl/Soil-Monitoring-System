import { Droplets, ThermometerSun, Leaf, Activity, Beaker, MapPin } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-emerald-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-300/40 dark:bg-emerald-800/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-teal-300/30 dark:bg-teal-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 py-20 relative z-10 flex flex-col items-center">
        {/* Header Section */}
        <header className="text-center mb-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-medium text-sm mb-6 border border-emerald-200 dark:border-emerald-800/50 animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Real-time Systems Active
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">Soil Monitoring</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400">
            Harness precision agriculture. Monitor moisture, temperature, and pH levels continuously to optimize plant health and conserve resources.
          </p>
        </header>

        {/* Dashboard Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          
          <DashboardCard
            title="Moisture Level"
            value="42.5%"
            status="Optimal"
            statusColor="text-emerald-600 dark:text-emerald-400"
            icon={<Droplets className="w-6 h-6 text-blue-500 dark:text-blue-400" />}
            trend="+2.1% past hour"
          />

          <DashboardCard
            title="Temperature"
            value="24.1°C"
            status="Stable"
            statusColor="text-amber-600 dark:text-amber-400"
            icon={<ThermometerSun className="w-6 h-6 text-amber-500 dark:text-amber-400" />}
            trend="-0.5°C past hour"
          />

          <DashboardCard
            title="Soil pH"
            value="6.8"
            status="Slightly Acidic"
            statusColor="text-purple-600 dark:text-purple-400"
            icon={<Beaker className="w-6 h-6 text-purple-500 dark:text-purple-400" />}
            trend="Unchanged"
          />

          <DashboardCard
            title="Plant Vitality"
            value="98/100"
            status="Excellent"
            statusColor="text-emerald-600 dark:text-emerald-400"
            icon={<Leaf className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />}
            trend="Peak condition"
            className="md:col-span-2 lg:col-span-1"
          />

          <div className="md:col-span-2 relative group rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl overflow-hidden p-8 flex flex-col justify-center transition-all hover:shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
               <Activity className="w-8 h-8 text-teal-500" />
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Live Analytics</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
               Access high-resolution temporal data and predictive modeling based on real-time neural network analysis of your fields.
            </p>
            <div className="mt-auto flex gap-4">
              <button className="px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                View Charts
              </button>
              <button className="px-6 py-3 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({ 
  title, 
  value, 
  status, 
  statusColor, 
  icon, 
  trend,
  className = ""
}: { 
  title: string; 
  value: string; 
  status: string; 
  statusColor: string; 
  icon: React.ReactNode;
  trend: string;
  className?: string;
}) {
  return (
    <div className={`group rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-sm ${statusColor}`}>
          {status}
        </span>
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
        </div>
        <p className="text-sm mt-3 text-slate-500 dark:text-slate-400 font-medium">{trend}</p>
      </div>
    </div>
  );
}
