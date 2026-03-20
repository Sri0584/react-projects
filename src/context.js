import React, { useState, useContext, useEffect } from "react";
import { useRef } from "react";
import { useMemo } from "react";
import { useCallback } from "react";

const url = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=";
const AppContext = React.createContext();

const AppProvider = ({ children }) => {
	const [cocktails, setCocktails] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchterm, setSearchterm] = useState("a");
	const [inputValue, setInputValue] = useState("a");
	const [error, setError] = useState(null);
	const [emptyResult, setEmptyResult] = useState(false);

	const cache = useRef({});

	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchterm(inputValue.trim().toLowerCase());
		}, 500);

		return () => clearTimeout(timer);
	}, [inputValue]);

	const fetchData = useCallback(async () => {
		if (cache.current[searchterm]) {
			setCocktails(cache.current[searchterm]);
			setEmptyResult(cache.current[searchterm].length === 0);
			setError(null);
			return;
		}
		const controller = new AbortController();
		setLoading(true);
		setError(null);
		setEmptyResult(false);
		try {
			const response = await fetch(`${url}${searchterm}`, {
				signal: controller.signal,
			});
			const data = await response.json();
			const { drinks } = data;
			if (drinks) {
				const newDrinks = drinks.map((drink) => {
					const { idDrink, strDrinkThumb, strGlass, strAlcoholic, strDrink } =
						drink;
					return {
						id: idDrink,
						name: strDrink,
						image: strDrinkThumb,
						glass: strGlass,
						info: strAlcoholic,
					};
				});
				cache.current[searchterm] = newDrinks;
				setCocktails(newDrinks);
				setEmptyResult(false);
				setLoading(false);
			} else {
				setCocktails([]);
				setEmptyResult(true);
				cache.current[searchterm] = [];
				setLoading(false);
			}
		} catch (error) {
			setLoading(false);
			if (error.name !== "AbortError") {
				setError("Failed to load cocktails. Please try again.");
			}
		}
		return () => controller.abort();
	}, [searchterm]);

	const updateSearch = useCallback((val) => {
		setInputValue(val);
	}, []);

	useEffect(() => {
		const cleanup = fetchData();
		return () => {
			if (cleanup instanceof Function) {
				cleanup();
			}
		};
	}, [fetchData]);

	const contextValue = useMemo(
		() => ({
			loading,
			cocktails,
			searchterm: inputValue,
			setSearchterm: updateSearch,
			error,
			emptyResult,
		}),
		[loading, cocktails, inputValue, updateSearch, error, emptyResult],
	);

	return (
		<AppContext.Provider value={contextValue}>
			<div aria-live='polite' aria-busy={loading}>
				{children}
			</div>
		</AppContext.Provider>
	);
};

export const useGlobalContext = () => {
	return useContext(AppContext);
};

export { AppContext, AppProvider };
