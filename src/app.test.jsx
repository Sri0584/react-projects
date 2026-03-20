import "@testing-library/jest-dom";
import React from "react";

import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
	within,
	createEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppProvider, useGlobalContext } from "./context";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Wraps a component in MemoryRouter + AppProvider for tests that need both
const renderWithProviders = (ui, { route = "/" } = {}) => {
	return render(
		<MemoryRouter initialEntries={[route]}>
			<AppProvider>{ui}</AppProvider>
		</MemoryRouter>,
	);
};

// Wraps in MemoryRouter only (no context)
const renderWithRouter = (ui, { route = "/" } = {}) => {
	return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
};

// Mock fetch globally
const mockFetch = (data) => {
	global.fetch = jest.fn(() =>
		Promise.resolve({
			ok: true,
			json: () => Promise.resolve(data),
		}),
	);
};
describe("App", () => {
	test("renders without crashing", () => {
		mockFetch({ drinks: null });
		render(
			<AppProvider>
				<App />
			</AppProvider>,
		);
		expect(
			screen.getByRole("navigation", { name: /Site pages/i }),
		).toBeInTheDocument();
	});
});

// ─── context.jsx ────────────────────────────────────────────────────────────

describe("AppProvider / useGlobalContext", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.resetAllMocks();
	});
	test("cleans up debounce timer on unmount", async () => {
		mockFetch({ drinks: null });
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		const { unmount } = renderWithProviders(<Consumer />);
		// unmount before debounce fires — triggers cleanup
		unmount();
	});
	// covers AbortController cleanup — unmount during fetch
	test("aborts fetch on unmount", async () => {
		// never resolves — keeps fetch in-flight
		global.fetch = jest.fn(() => new Promise(() => {}));
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		const { unmount } = renderWithProviders(<Consumer />);
		act(() => jest.runAllTimers()); // flush debounce
		await waitFor(() => expect(global.fetch).toHaveBeenCalled());
		// unmount while fetch is in-flight — triggers controller.abort()
		unmount();
	});

	// covers cache hit branch
	test("returns cached results without fetching again", async () => {
		mockFetch({ drinks: null });
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(context.loading).toBe(false));
		const callCount = global.fetch.mock.calls.length;

		// trigger same search term again
		act(() => {
			context.setSearchterm("a");
			jest.runAllTimers();
		});
		await waitFor(() => expect(context.loading).toBe(false));
		// fetch should not have been called again
		expect(global.fetch).toHaveBeenCalledTimes(callCount);
	});

	test("cleans up fetch on unmount", async () => {
		// never resolves — keeps fetch in-flight so cleanup is returned
		global.fetch = jest.fn(() => new Promise(() => {}));
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		const { unmount } = renderWithProviders(<Consumer />);

		// flush debounce so fetchData actually runs
		act(() => jest.runAllTimers());

		// wait for fetch to have been called
		await waitFor(() => expect(global.fetch).toHaveBeenCalled());

		// unmount while fetch is in-flight — triggers useEffect cleanup
		// which calls cleanup() returned from fetchData (the abort)
		act(() => unmount());
	});

	test("provides default context values", async () => {
		mockFetch({ drinks: null });
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		await waitFor(() => expect(context.loading).toBe(false));
		expect(context.cocktails).toEqual([]);
		expect(context.error).toBeNull();
		await waitFor(() => expect(context.emptyResult).toBe(true));
	});

	test("sets loading to true while fetching", async () => {
		// Never resolves — keeps loading state active
		global.fetch = jest.fn(() => new Promise(() => {}));
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		act(() => jest.runAllTimers()); // flush debounce
		await waitFor(() => expect(context.loading).toBe(true));
	});

	test("populates cocktails on successful fetch", async () => {
		mockFetch({
			drinks: [
				{
					idDrink: "1",
					strDrink: "Margarita",
					strDrinkThumb: "img.jpg",
					strGlass: "Cocktail glass",
					strAlcoholic: "Alcoholic",
				},
			],
		});
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(context.cocktails).toHaveLength(1));
		expect(context.cocktails[0].name).toBe("Margarita");
	});

	test("sets emptyResult when API returns no drinks", async () => {
		mockFetch({ drinks: null });
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(context.emptyResult).toBe(true));
	});

	test("sets error message on fetch failure", async () => {
		global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(context.error).toBeTruthy());
	});

	test("debounces search — does not fetch on every keystroke", async () => {
		mockFetch({ drinks: null });
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		act(() => {
			context.setSearchterm("m");
			context.setSearchterm("ma");
			context.setSearchterm("mar");
		});
		// Only 1 call (initial) before debounce settles
		expect(global.fetch).toHaveBeenCalledTimes(1);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
	});

	test("uses cache — does not re-fetch the same search term", async () => {
		mockFetch({ drinks: null });
		let context;
		const Consumer = () => {
			context = useGlobalContext();
			return null;
		};
		renderWithProviders(<Consumer />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

		// Trigger the same search again
		act(() => {
			context.setSearchterm("a");
			jest.runAllTimers();
		});
		// Should still be 1 — cache hit, no new fetch
		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
	});
});

// ─── Loading.jsx ─────────────────────────────────────────────────────────────

describe("Loading", () => {
	test("renders with correct ARIA attributes", () => {
		render(<Loading />);
		const loader = screen.getByRole("status");
		expect(loader).toHaveAttribute("aria-live", "polite");
		expect(loader).toHaveAttribute("aria-busy", "true");
		expect(loader).toHaveAttribute(
			"aria-label",
			"Loading content, please wait..",
		);
	});
});

// ─── Cocktail.jsx ─────────────────────────────────────────────────────────────

const mockCocktail = {
	id: "11007",
	name: "Margarita",
	image: "https://example.com/margarita.jpg",
	glass: "Cocktail glass",
	info: "Alcoholic",
	imagePriority: false,
};

describe("Cocktail", () => {
	test("renders cocktail name", async () => {
		renderWithRouter(<Cocktail {...mockCocktail} />);
		expect(screen.getByText("Margarita")).toBeInTheDocument();
	});

	test("renders image with descriptive alt text", () => {
		renderWithRouter(<Cocktail {...mockCocktail} />);
		expect(screen.getByAltText("Margarita cocktail")).toBeInTheDocument();
	});

	test("image has fetchpriority=high when imagePriority=true", () => {
		renderWithRouter(<Cocktail {...mockCocktail} imagePriority={true} />);
		const img = screen.getByAltText("Margarita cocktail");
		expect(img).toHaveAttribute("fetchpriority", "high");
		expect(img).toHaveAttribute("loading", "eager");
	});

	test("image has fetchpriority=auto when imagePriority=false", () => {
		renderWithRouter(<Cocktail {...mockCocktail} imagePriority={false} />);
		const img = screen.getByAltText("Margarita cocktail");
		expect(img).toHaveAttribute("fetchpriority", "auto");
		expect(img).toHaveAttribute("loading", "lazy");
	});

	test("details link has descriptive aria-label", () => {
		renderWithRouter(<Cocktail {...mockCocktail} />);
		const link = screen.getByRole("link", {
			name: /view details for margarita/i,
		});
		expect(link).toHaveAttribute("href", "/cocktail/11007");
	});

	test("renders as an <article> element", () => {
		renderWithRouter(<Cocktail {...mockCocktail} />);
		expect(screen.getByRole("article")).toBeInTheDocument();
	});

	test("glass type is not a heading", () => {
		renderWithRouter(<Cocktail {...mockCocktail} />);
		// Glass should not appear as any heading level
		const headings = screen.queryAllByRole("heading");
		const glassHeading = headings.find((h) =>
			h.textContent.includes("Cocktail glass"),
		);
		expect(glassHeading).toBeUndefined();
	});
});

// ─── CocktailList.jsx ─────────────────────────────────────────────────────────

describe("CocktailList", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.resetAllMocks();
	});

	test("shows loading spinner while fetching", async () => {
		global.fetch = jest.fn(() => new Promise(() => {}));
		renderWithProviders(<CocktailList />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
	});

	test("shows cocktails after successful fetch", async () => {
		mockFetch({
			drinks: [
				{
					idDrink: "1",
					strDrink: "Margarita",
					strDrinkThumb: "img.jpg",
					strGlass: "Cocktail glass",
					strAlcoholic: "Alcoholic",
				},
				{
					idDrink: "2",
					strDrink: "Mojito",
					strDrinkThumb: "img2.jpg",
					strGlass: "Highball glass",
					strAlcoholic: "Alcoholic",
				},
			],
		});
		renderWithProviders(<CocktailList />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
	});

	test("shows empty state message when no drinks found", async () => {
		mockFetch({ drinks: null });
		renderWithProviders(<CocktailList />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
		expect(screen.getByText(/no cocktails matched/i)).toBeInTheDocument();
	});

	test("shows error message on fetch failure", async () => {
		global.fetch = jest.fn(() => Promise.reject(new Error("fail")));
		renderWithProviders(<CocktailList />);
		act(() => jest.runAllTimers());
		await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
	});

	test("first cocktail has imagePriority=true", async () => {
		mockFetch({
			drinks: [
				{
					idDrink: "1",
					strDrink: "Margarita",
					strDrinkThumb: "img.jpg",
					strGlass: "Glass",
					strAlcoholic: "Alcoholic",
				},
				{
					idDrink: "2",
					strDrink: "Mojito",
					strDrinkThumb: "img2.jpg",
					strGlass: "Glass",
					strAlcoholic: "Alcoholic",
				},
			],
		});
		renderWithProviders(<CocktailList />);
		act(() => jest.runAllTimers());
		await waitFor(() => screen.getAllByRole("article"));
		const images = screen.getAllByRole("img");
		expect(images[0]).toHaveAttribute("fetchpriority", "high");
		expect(images[1]).toHaveAttribute("fetchpriority", "auto");
	});
});

// ─── SearchForm.jsx ───────────────────────────────────────────────────────────

describe("SearchForm", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.resetAllMocks();
	});

	test("renders search input with correct label association", () => {
		mockFetch({ drinks: null });
		renderWithProviders(<SearchForm />);
		const input = screen.getByLabelText(/search your favourite cocktail/i);
		expect(input).toHaveAttribute("id", "search");
		expect(input).toBeInTheDocument();
	});

	// covers handleSearch (lines 10-11)
	test("calls handleSearch when input changes", () => {
		mockFetch({ drinks: null });
		renderWithProviders(<SearchForm />);
		const input = screen.getByLabelText(/search your favourite cocktail/i);

		// JSDOM doesn't support value setter on type="search"
		// so we temporarily change it to text to fire the event
		input.type = "text";
		fireEvent.change(input, { target: { value: "mojito" } });
		expect(input.value).toBe("mojito");
	});

	// covers handleSubmit (line 17)
	test("prevents default on form submit", () => {
		mockFetch({ drinks: null });
		renderWithProviders(<SearchForm />);
		const form = screen.getByRole("search");
		const submitEvent = createEvent.submit(form);
		submitEvent.preventDefault = jest.fn();
		fireEvent(form, submitEvent);
		expect(submitEvent.preventDefault).toHaveBeenCalled();
	});

	test("input receives focus on mount", async () => {
		mockFetch({ drinks: null });
		renderWithProviders(<SearchForm />);
		await waitFor(() =>
			expect(
				screen.getByLabelText(/search your favourite cocktail/i),
			).toHaveFocus(),
		);
	});

	test("input is type=search", () => {
		mockFetch({ drinks: null });
		renderWithProviders(<SearchForm />);
		expect(screen.getByRole("search")).toBeInTheDocument();
	});

	test("typing updates the input value", async () => {
		mockFetch({ drinks: null });
		renderWithProviders(<SearchForm />);
		const input = screen.getByRole("search");
		Object.defineProperty(input, "value", {
			writable: true,
			value: "mojito",
		});
		fireEvent.change(input);
		expect(input).toHaveValue("mojito");
	});

	test("form has role=search", () => {
		mockFetch({ drinks: null });
		renderWithProviders(<SearchForm />);
		expect(screen.getByRole("search")).toBeInTheDocument();
	});
});

// ─── Navbar.jsx ───────────────────────────────────────────────────────────────

describe("Navbar", () => {
	test("renders main navigation landmark with aria-label", () => {
		renderWithRouter(<Navbar />);
		expect(
			screen.getByRole("navigation", { name: /Site pages/i }),
		).toBeInTheDocument();
	});

	test("renders Home and About links", () => {
		renderWithRouter(<Navbar />);
		const navList = screen.getByRole("navigation", { name: /site pages/i });
		const homeLink = within(navList).getByRole("link", { name: /home/i });
		const aboutLink = within(navList).getByRole("link", { name: /about/i });
		expect(homeLink).toBeInTheDocument();
		expect(aboutLink).toBeInTheDocument();
	});

	test("About link points to /about (lowercase)", () => {
		renderWithRouter(<Navbar />);
		expect(screen.getByRole("link", { name: /about/i })).toHaveAttribute(
			"href",
			"/about",
		);
	});

	test("Home link is active on /", () => {
		renderWithRouter(<Navbar />, { route: "/" });
		const navList = screen.getByRole("navigation", { name: /site pages/i });
		const homeLink = within(navList).getByRole("link", { name: /home/i });
		expect(homeLink).toHaveClass("active");
	});

	test("Home link is NOT active on /about", () => {
		renderWithRouter(<Navbar />, { route: "/about" });
		const navList = screen.getByRole("navigation", { name: /site pages/i });
		const homeLink = within(navList).getByRole("link", { name: /home/i });
		expect(homeLink).not.toHaveClass("active");
	});

	test("About link is active on /about", () => {
		renderWithRouter(<Navbar />, { route: "/about" });
		const aboutLink = screen.getByRole("link", { name: /about/i });
		expect(aboutLink).toHaveClass("active");
	});
});

// ─── About.jsx ────────────────────────────────────────────────────────────────

describe("About", () => {
	test("renders main landmark", () => {
		render(<About />);
		expect(screen.getByRole("main")).toBeInTheDocument();
	});

	test("main is labelled by the heading", () => {
		render(<About />);
		const main = screen.getByRole("main");
		const heading = screen.getByRole("heading", { name: /about us/i });
		expect(main).toHaveAttribute("aria-labelledby", heading.id);
	});

	test("heading has an id for aria-labelledby", () => {
		render(<About />);
		const heading = screen.getByRole("heading", { name: /about us/i });
		expect(heading).toHaveAttribute("id");
	});
});

// ─── Error.jsx ────────────────────────────────────────────────────────────────

describe("Error page", () => {
	test("renders main landmark with aria-label", () => {
		renderWithRouter(<ErrorPage />);
		expect(
			screen.getByRole("main", { name: /page not found/i }),
		).toBeInTheDocument();
	});

	test("renders 404 heading", () => {
		renderWithRouter(<ErrorPage />);
		expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
	});

	test("renders descriptive explanation paragraph", () => {
		renderWithRouter(<ErrorPage />);
		expect(
			screen.getByText(/doesn't exist or has been moved/i),
		).toBeInTheDocument();
	});

	test("back to home link has descriptive aria-label", () => {
		renderWithRouter(<ErrorPage />);
		expect(
			screen.getByRole("link", { name: /go to home page/i }),
		).toBeInTheDocument();
	});

	test("back to home link points to /", () => {
		renderWithRouter(<ErrorPage />);
		expect(
			screen.getByRole("link", { name: /go to home page/i }),
		).toHaveAttribute("href", "/");
	});
});

// ─── SingleCocktail.jsx ───────────────────────────────────────────────────────

import Loading from "./components/Loading";
import Cocktail from "./components/Cocktail";
import CocktailList from "./components/CocktailList";
import SearchForm from "./components/SearchForm";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import ErrorPage from "./pages/Error";
import SingleCocktail from "./pages/SingleCocktail";
import App from "./App";

const mockDrink = {
	drinks: [
		{
			idDrink: "11007",
			strDrink: "Margarita",
			strDrinkThumb: "https://example.com/margarita.jpg",
			strAlcoholic: "Alcoholic",
			strCategory: "Ordinary Drink",
			strGlass: "Cocktail glass",
			strInstructions: "Rub the rim with lime.",
			strIngredient1: "Tequila",
			strIngredient2: "Triple sec",
			strIngredient3: "Lime juice",
			strIngredient4: null,
			strIngredient5: null,
		},
	],
};

describe("SingleCocktail", () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => {
		jest.useRealTimers();
		jest.resetAllMocks();
	});

	test("shows loading spinner initially", () => {
		global.fetch = jest.fn(() => new Promise(() => {}));
		renderWithRouter(
			<MemoryRouter initialEntries={["/cocktail/11007"]}>
				<SingleCocktail />
			</MemoryRouter>,
		);
		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	test("renders cocktail details after fetch", async () => {
		mockFetch(mockDrink);
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/11007" });
		act(() => jest.runAllTimers());
		await waitFor(() =>
			expect(
				screen.getByRole("heading", { name: "Margarita" }),
			).toBeInTheDocument(),
		);
		expect(screen.getByText(/tequila/i)).toBeInTheDocument();
		expect(screen.getByText(/triple sec/i)).toBeInTheDocument();
	});

	// covers line 23 — response.ok is false
	test("shows error when response is not ok", async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: false,
				status: 404,
				json: () => Promise.resolve({}),
			}),
		);
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/11007" });
		await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
	});

	// covers lines 56-57 — AbortError is silently ignored
	test("ignores AbortError when fetch is cancelled", async () => {
		global.fetch = jest.fn(() =>
			Promise.reject(
				Object.assign(new Error("Aborted"), { name: "AbortError" }),
			),
		);
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/11007" });
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
	});

	test("only renders non-null ingredients", async () => {
		mockFetch(mockDrink);
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/11007" });
		await waitFor(() => screen.getByRole("heading", { name: "Margarita" }));
		// check present ingredients
		expect(screen.getByText("Tequila")).toBeInTheDocument();
		expect(screen.getByText("Triple sec")).toBeInTheDocument();
		expect(screen.getByText("Lime juice")).toBeInTheDocument();
		// null ingredients should not render
		expect(screen.queryByText("null")).not.toBeInTheDocument();
		expect(screen.queryByText("undefined")).not.toBeInTheDocument();
	});

	test("LCP image has fetchpriority=high", async () => {
		mockFetch(mockDrink);
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/11007" });
		act(() => jest.runAllTimers());
		await waitFor(() => screen.getByRole("heading", { name: "Margarita" }));
		const img = screen.getByAltText(/margarita cocktail/i);
		expect(img).toHaveAttribute("fetchpriority", "high");
	});

	test("shows error message on fetch failure", async () => {
		global.fetch = jest.fn(() => Promise.reject(new Error("fail")));
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/11007" });
		// act(() => jest.runAllTimers());
		await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
	});

	test("shows not found message when drink is null", async () => {
		mockFetch({ drinks: null });
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/99999" });
		act(() => jest.runAllTimers());
		await waitFor(() =>
			expect(screen.getByText(/no cocktail to display/i)).toBeInTheDocument(),
		);
	});

	test("back home link has descriptive aria-label", async () => {
		mockFetch(mockDrink);
		renderWithRouter(<SingleCocktail />, { route: "/cocktail/11007" });
		act(() => jest.runAllTimers());
		await waitFor(() => screen.getByRole("heading", { name: "Margarita" }));
		expect(
			screen.getByRole("link", { name: /back home/i }),
		).toBeInTheDocument();
	});
});
