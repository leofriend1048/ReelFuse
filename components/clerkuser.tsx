// ClerkUser.server.tsx
import { currentUser } from '@clerk/nextjs';
import React from 'react';

// Assuming currentUser() returns a type that can be inferred or is explicitly defined in @clerk/nextjs
// If not, you might need to define an interface for the user object
export async function ClerkUser(): Promise<JSX.Element> {
  const user = await currentUser();

  if (!user) return <div>Not signed in</div>;

  // Assuming user.firstName is a string. Adjust according to the actual type.
  return <div>Hello {user.firstName}</div>;
}
