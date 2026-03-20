import { useGlobalContext } from "../context";
import React, { useCallback, useState } from "react";

const SearchForm = () => {
	const [inputValue, setInputValue] = useState("");
	const { setSearchterm } = useGlobalContext();

	const handleSearch = useCallback(
		(e) => {
			setInputValue(e.target.value);
			setSearchterm(e.target.value); // debouncing is handled inside context
		},
		[setSearchterm],
	);

	const handleSubmit = useCallback((e) => {
		e.preventDefault();
	}, []);

	const inputRef = useCallback((node) => {
		if (node) node.focus();
	}, []);

	return (
		<div className='section search'>
			<form className='search-form ' onSubmit={handleSubmit} role='search'>
				<div className='form-control'>
					<label htmlFor='search'>Search your Favourite Cocktail</label>
					<input
						id='search'
						type='text'
						name='search'
						ref={inputRef}
						onChange={handleSearch}
						value={inputValue}
						placeholder='e.g. Margarita'
						aria-label='Search for a cocktail'
					/>
				</div>
			</form>
		</div>
	);
};

export default SearchForm;
