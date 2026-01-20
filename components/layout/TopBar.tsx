import { Bell, Search } from "lucide-react";


export function TopBar() {
    return (
        <header className="fixed top-0 z-30 ml-64 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-neutral/10 bg-white/80 px-6 backdrop-blur-sm">
            <div className="w-96">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                    <input
                        type="text"
                        placeholder="Search students, logs, or companies..."
                        className="h-10 w-full rounded-full border border-neutral/20 bg-neutral/5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative rounded-full p-2 text-neutral hover:bg-neutral/10 transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-white"></span>
                </button>

                <div className="flex items-center gap-3 border-l border-neutral/20 pl-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-neutral-dark">Admin User</p>
                        <p className="text-xs text-neutral">Superteacher</p>
                    </div>
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                        AU
                    </div>
                </div>
            </div>
        </header>
    );
}
