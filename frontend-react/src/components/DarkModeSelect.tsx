import React, { useState, useEffect } from "react";
import Select, { type StylesConfig } from "react-select";

interface Option {
    value: number | string;
    label: string;
}

interface Props {
    options: Option[];
    placeholder?: string;
    isMulti?: boolean;
    value: any;
    onChange: (value: any) => void;
}

const DarkModeSelect: React.FC<Props> = ({ options, placeholder, isMulti = false, value, onChange }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        setIsDark(document.documentElement.classList.contains("dark"));

        return () => observer.disconnect();
    }, []);

    const customStyles: StylesConfig = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: isDark ? "#1f2937" : "#fff",
            borderColor: state.isFocused
                ? "#ef4444"
                : isDark
                    ? "#374151"
                    : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 3px rgba(239, 68, 68, 0.2)" : "none",
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: isDark ? "#1f2937" : "#fff",
            color: isDark ? "#f9fafb" : "#111827",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused
                ? isDark
                    ? "#374151"
                    : "#f3f4f6"
                : isDark
                    ? "#1f2937"
                    : "#fff",
            color: isDark ? "#f9fafb" : "#111827",
            cursor: "pointer",
        }),
        singleValue: (provided) => ({
            ...provided,
            color: isDark ? "#f9fafb" : "#111827", // <-- selected value text color
        }),
        placeholder: (provided) => ({
            ...provided,
            color: isDark ? "#d1d5db" : "#6b7280", // <-- placeholder color
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: isDark ? "#374151" : "#f3f4f6",
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: isDark ? "#f9fafb" : "#111827", // <-- selected pill text color
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: isDark ? "#f87171" : "#ef4444",
            ":hover": {
                backgroundColor: isDark ? "#f87171" : "#ef4444",
                color: "#fff",
            },
        }),
    };

    // Helper to compare option.value and incoming value loosely (string/number)
    const isEqual = (optVal: any, val: any) => String(optVal) === String(val);

    const computeValue = () => {
        if (isMulti) {
            if (!Array.isArray(value)) return [];
            return options.filter((option) => value.some((v: any) => isEqual(option.value, v)));
        }

        if (value === null || value === undefined || value === "") return null;

        return options.find((option) => isEqual(option.value, value)) || null;
    };

    return (
        <Select
            options={options}
            placeholder={placeholder}
            isMulti={isMulti}
            styles={customStyles}
            value={computeValue()}
            onChange={(selected: any) =>
                isMulti
                    ? onChange(selected ? selected.map((s: any) => s.value) : [])
                    : onChange((selected as any)?.value)
            }
        />
    );
};

export default DarkModeSelect;
