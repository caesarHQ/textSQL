import { v4 as uuidv4 } from 'uuid';

export const getUserId = () => {
  const localStorageKey = 'census_user_id';
  let userId = localStorage.getItem(localStorageKey);

  if (!userId) {
    // Generate a unique ID for the user
    userId = `${uuidv4()}_${new Date().getTime()}`;

    // Save the user ID in local storage
    localStorage.setItem(localStorageKey, userId);
  }

  return userId;
}
