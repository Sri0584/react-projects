import React from "react";
import { Link } from "react-router-dom";

const Error = () => {
	return (
		<main className='error-page' aria-label='Page not found'>
			<div className='error-container'>
				<h2>404 - Page not found</h2>
				<p>The page you're looking for doesn't exist or has been moved.</p>
				<Link to='/' className='btn btn-primary' aria-label='Go to homepage'>
					Go to homepage
				</Link>
			</div>
		</main>
	);
};

export default Error;
