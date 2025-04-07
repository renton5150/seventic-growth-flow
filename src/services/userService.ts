
// This file is now just a re-export from the modularized user service
// It maintains backward compatibility while providing a cleaner structure

export {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  resendInvitation,
  isValidUserRole
} from './user';

export type {
  CreateUserResponse,
  ActionResponse
} from './user/types';
