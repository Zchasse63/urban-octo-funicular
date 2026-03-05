import { useEffect, useState } from "react";
import { DEBOUNCE_DEFAULT_MS } from "@/lib/constants";

function useDebounce<T>(value: T, delay: number = DEBOUNCE_DEFAULT_MS): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default useDebounce;
