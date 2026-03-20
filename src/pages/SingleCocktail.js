import React from "react";
import Loading from "../components/Loading";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function SingleCocktail() {
	const { id } = useParams();
	const [loading, setLoading] = useState(false);
	const [cocktail, setCocktail] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);

		const getCocktail = async () => {
			try {
				const response = await fetch(
					`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`,
					{ signal: controller.signal },
				);
				if (!response.ok) {
					throw new Error(`Network error! status: ${response.status}`);
				}
				const data = await response.json();
				if (data.drinks) {
					const {
						strDrink: name,
						strDrinkThumb: image,
						strAlcoholic: info,
						strCategory: category,
						strGlass: glass,
						strInstructions: instructions,
					} = data.drinks[0];
					const ingredients = Array.from(
						{ length: 15 },
						(_, index) => data.drinks[0][`strIngredient${index + 1}`],
					).filter(Boolean);
					const newCocktail = {
						name,
						image,
						info,
						category,
						glass,
						instructions,
						ingredients,
					};
					setCocktail(newCocktail);
				} else {
					setCocktail(null);
				}
			} catch (error) {
				if (error.name !== "AbortError") {
					setError("Could not load cocktail details. Please try again.");
				} else {
					console.log("Fetch aborted");
					return;
				}
			} finally {
				setLoading(false);
			}
		};

		getCocktail();

		return () => controller.abort();
	}, [id]);

	if (loading) {
		return <Loading />;
	}

	if (error) {
		return (
			<div className='section-title' role='alert' aria-live='assertive'>
				<p>{error}</p>
				<Link to='/' className='btn btn-primary' aria-label='Go to home page'>
					Return to home and try again
				</Link>
			</div>
		);
	}

	if (!cocktail) {
		return (
			<p className='section-title' role='status'>
				no cocktail to display
			</p>
		);
	}

	const { name, image, category, info, glass, instructions, ingredients } =
		cocktail;

	return (
		<section
			className='section cocktail-section'
			aria-labelledby='Back to cocktails list'
		>
			<Link to='/' className='btn btn-primary'>
				Back home
			</Link>
			<h2 className='section-title'>{name}</h2>
			<div className='drink'>
				<img
					src={image}
					alt={`${name} cocktail`}
					fetchPriority='high'
					loading='eager'
				/>
				<div className='drink-info'>
					<p>
						<span className='drink-data'>name :</span> {name}
					</p>
					<p>
						<span className='drink-data'>category :</span> {category}
					</p>
					<p>
						<span className='drink-data'>info :</span> {info}
					</p>
					<p>
						<span className='drink-data'>glass :</span> {glass}
					</p>
					<p>
						<span className='drink-data'>instructons :</span> {instructions}
					</p>
					<p>
						<span className='drink-data'>ingredients :</span>
						<ul aria-label='List of ingredients'>
							{ingredients.map((item, index) => {
								return item ? <li key={index}>{item}</li> : null;
							})}
						</ul>
					</p>
				</div>
			</div>
		</section>
	);
}
