"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, Sparkles } from "lucide-react";

export default function Modal01() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="flex justify-center">
                <Button
                    onClick={() => setIsOpen(true)}
                    className="bg-black hover:bg-gray-900 text-white"
                >
                    Open Modal
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <DialogHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                        <DialogTitle className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                            <div className="w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/20 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                            </div>
                            Unlock Features
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-md text-zinc-500 dark:text-zinc-400">
                            Upgrade to our lifetime access plan to enjoy
                            unlimited PDF downloads and all features.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                                What's included:
                            </h4>
                            <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-2">
                                {[
                                    "Unlimited PDF downloads",
                                    "Templates Customization",
                                    "Invoice History",
                                    "Free Updates",
                                ].map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-2"
                                    >
                                        <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="w-full h-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800"
                        >
                            Maybe Later
                        </Button>
                        <Button
                            onClick={() => setIsOpen(false)}
                            className="w-full h-9 bg-black hover:bg-gray-900 text-white"
                        >
                            Get Lifetime Access
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
