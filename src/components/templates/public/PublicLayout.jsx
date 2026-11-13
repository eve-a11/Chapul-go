import PublicNavbar from "../../organisms/public/PublicNavbar";

export default function PublicLayout({
  activeTab,
  onSelectTab,
  locationName,
  loggedIn,
  userName,
  onLogout,
  children,
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        locationName={locationName}
        loggedIn={loggedIn}
        userName={userName}
        onLogout={onLogout}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {children}
      </main>
    </div>
  );
}