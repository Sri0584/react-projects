import React from "react";
import Cocktail from "./Cocktail";
import Loading from "./Loading";
import { Link } from "react-router-dom";
import { useGlobalContext } from "../context";
import { useCallback } from "react";
import { memo } from "react";

const CocktailList = memo(() => {
	const { cocktails, loading, setSearchterm, error, emptyResult } =
		useGlobalContext();

	const handleReset = useCallback(() => {
		setSearchterm("a");
	}, [setSearchterm]);

	if (loading) {
		return <Loading />;
	}

	if (error) {
		return (
			<div className='section-title' role='alert' aria-live='assertive'>
				<p>{error}</p>
				<Link
					to='/'
					className='btn btn-primary'
					onClick={handleReset}
					aria-label='Return to home page and try again'
				>
					Return to home and try again
				</Link>
			</div>
		);
	}

	if (emptyResult) {
		return (
			<div className='section-title' role='status' aria-live='polite'>
				<p>No cocktails matched your search criteria,change your search!!</p>
				<Link
					to='/'
					className='btn btn-primary'
					onClick={handleReset}
					aria-label='Clear search and return to home page'
				>
					Return to home and try again
				</Link>
			</div>
		);
	}
	return (
		<section className='section'>
			<h2 className='section-title'>Cocktails</h2>
			<div className='cocktails-center'>
				{cocktails.map((cocktail, index) => {
					const { id, name, image, glass, info } = cocktail;
					return (
						<Cocktail
							key={cocktail.id}
							id={id}
							name={name}
							image={image}
							glass={glass}
							info={info}
							imagePriority={index === 0}
						/>
					);
				})}
			</div>
		</section>
	);
});

CocktailList.displayName = "CocktailList";

export default CocktailList;
