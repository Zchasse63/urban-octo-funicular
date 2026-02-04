import { cn } from "@/lib/utils";
import { Mail, Phone, Globe, Share2 } from "lucide-react";

interface Profile {
    image: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    website: string;
    bio: string;
}

const SAMPLE_PROFILE_DATA: Profile = {
    image: "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/profile-mjss82WnWBRO86MHHGxvJ2TVZuyrDv.jpeg",
    name: "Eugene An",
    title: "Senior Designer",
    email: "eugene.an@example.com",
    phone: "+1 (555) 123-4567",
    website: "eugenean.design",
    bio: "Passionate about creating intuitive user experiences and beautiful interfaces.",
};

interface Card02Props extends React.HTMLAttributes<HTMLDivElement> {
    data?: Profile;
}

export default function Card02({
    data = SAMPLE_PROFILE_DATA,
    className,
    ...props
}: Card02Props) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden",
                "w-full max-w-sm",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-200 dark:border-zinc-800",
                "rounded-2xl transition-all duration-300 hover:shadow-md",
                className
            )}
            {...props}
        >
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                            <img
                                src={data.image}
                                alt={data.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {data.name}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {data.title}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="h-8 w-8 flex items-center justify-center 
                        rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 
                        transition-colors"
                    >
                        <Share2 className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>
            </div>

            {/* Contact Information */}
            <div className="p-4 space-y-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span>{data.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span>{data.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <Globe className="w-4 h-4 text-zinc-500" />
                    <span>{data.website}</span>
                </div>
            </div>

            {/* Bio Section */}
            <div className="p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {data.bio}
                </p>
            </div>
        </div>
    );
}
