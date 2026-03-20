import React from "react";

const About = () => {
	// FIX: aria-labelledby points at the <h2> inside, giving the landmark a meaningful name for screen readers
	return (
		<main className='section about-section' aria-labelledby='about-us'>
			<h2 id='about-us' className='section-title'>
				About us
			</h2>
			<p>
				Welcome to Cocktail App — your go-to guide for discovering cocktails
				from around the world. Search by name, explore ingredients, and find
				your next favourite drink.
			</p>
		</main>
	);
};

export default About;
