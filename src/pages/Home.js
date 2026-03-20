import React from "react";
import CocktailList from "../components/CocktailList";
import SearchForm from "../components/SearchForm";

const Home = () => {
	return (
		<main id='main-content' aria-label='Cocktail search'>
			<SearchForm />
			<CocktailList />
		</main>
	);
};

export default Home;
