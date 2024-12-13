// // Import required dependencies and modules
// import { auth } from '@/auth/auth';
// import { toNextJsHandler } from 'better-auth/next-js';
// import arcjet, { protectSignup } from '@/security';
// import { NextRequest, NextResponse } from 'next/server';
//
// // Transform Better Auth handlers for Next.js
// const betterAuthHandlers = toNextJsHandler(auth.handler);
//
// // Define Arcjet protection rules
// const aj = arcjet.withRule(
//   protectSignup({
//     email: {
//       mode: 'LIVE',
//       block: ['INVALID', 'NO_MX_RECORDS'], // Block specific email types
//     },
//     bots: {
//       mode: 'LIVE',
//       allow: [], // Disallow all bot traffic
//     },
//     rateLimit: {
//       mode: 'LIVE', // Enable live rate limiting
//       interval: '10m', // Sliding window of 10 minutes
//       max: 5000, // Allow up to 5000 requests in the window
//     },
//   })
// );
//
// // Define type for email-specific error messages
// type EmailErrorMessages = {
//   [key: string]: string;
// };
//
// // Utility function to generate user-friendly email error messages
// const generateEmailErrorMessage = (emailTypes: string[]): string => {
//   const errorMessages: EmailErrorMessages = {
//     INVALID: 'Email address format is invalid.',
//     DISPOSABLE: 'Disposable email addresses are not allowed.',
//     NO_MX_RECORDS: 'The email domain does not have an MX record.',
//   };
//
//   for (const type of emailTypes) {
//     if (errorMessages[type]) {
//       return errorMessages[type];
//     }
//   }
//   return 'Invalid email.'; // Default error message
// };
//
// // Define a protected POST handler
// const ajProtectedPOST = async (req: NextRequest): Promise<NextResponse> => {
//   try {
//     // Parse the request body
//     const body = await req.clone().json();
//     const email = body.email as string;
//
//     // Apply Arcjet protections
//     const decision = await aj.protect(req, { email });
//
//     // Handle denied requests
//     if (decision.isDenied()) {
//       if (decision.reason.isEmail()) {
//         const message = generateEmailErrorMessage(decision.reason.emailTypes);
//         return NextResponse.json(
//           { message, reason: decision.reason },
//           { status: 400 }
//         );
//       }
//     }
//
//     // Delegate allowed requests to the Better Auth handler
//     const response = await betterAuthHandlers.POST(req);
//     const text = await response.text();
//     return new NextResponse(text, {
//       status: response.status,
//       headers: response.headers,
//     });
//   } catch (error) {
//     // Handle unexpected errors
//     console.error('Error handling POST request:', error);
//     return NextResponse.json(
//       { message: 'An unexpected error occurred.' },
//       { status: 500 }
//     );
//   }
// };
//
// // Export the handlers for the API route
// export const POST = ajProtectedPOST; // Protected POST handler
// export const { GET } = betterAuthHandlers; // Reuse GET handler from Better Auth

import { auth } from '@/auth/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth.handler);

// TODO: While reset password the config doesn't work, check it later before final release, or release it later as a feature
