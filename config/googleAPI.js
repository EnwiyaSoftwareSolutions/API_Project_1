const { google } = require("googleapis");

const BUSINESS_PROFILE_SCOPE = [
	"https://www.googleapis.com/auth/business.manage",
];

const requiredEnvVars = [
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"GOOGLE_REDIRECT_URI",
];

function validateConfig() {
	const missing = requiredEnvVars.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing Google API environment variables: ${missing.join(", ")}`
		);
	}
}

function getOAuth2Client() {
	validateConfig();

	const oAuth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI
	);

	if (process.env.GOOGLE_REFRESH_TOKEN) {
		oAuth2Client.setCredentials({
			refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
		});
	}

	return oAuth2Client;
}

function getGoogleConsentUrl() {
	const oAuth2Client = getOAuth2Client();

	return oAuth2Client.generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		scope: BUSINESS_PROFILE_SCOPE,
	});
}

async function exchangeCodeForTokens(code) {
	const oAuth2Client = getOAuth2Client();
	const { tokens } = await oAuth2Client.getToken(code);

	return tokens;
}

function createBusinessProfilePerformanceClient() {
	const auth = getOAuth2Client();

	return google.businessprofileperformance({
		version: "v1",
		auth,
	});
}

async function fetchMultiDailyMetricsTimeSeries({
	locationName,
	startDate,
	endDate,
	dailyMetrics,
}) {
	if (!locationName) {
		throw new Error("locationName is required (example: locations/123456789)");
	}

	if (!startDate || !endDate) {
		throw new Error("startDate and endDate are required in YYYY-MM-DD format");
	}

	if (!Array.isArray(dailyMetrics) || dailyMetrics.length === 0) {
		throw new Error("dailyMetrics must be a non-empty array");
	}

	const performanceApi = createBusinessProfilePerformanceClient();

	const response = await performanceApi.locations.fetchMultiDailyMetricsTimeSeries(
		{
			location: locationName,
			requestBody: {
				dailyRange: {
					startDate: toGoogleDate(startDate),
					endDate: toGoogleDate(endDate),
				},
				dailyMetrics,
			},
		}
	);

	return response.data;
}

function toGoogleDate(value) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date value: ${value}`);
	}

	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
	};
}

module.exports = {
	BUSINESS_PROFILE_SCOPE,
	getOAuth2Client,
	getGoogleConsentUrl,
	exchangeCodeForTokens,
	createBusinessProfilePerformanceClient,
	fetchMultiDailyMetricsTimeSeries,
};
