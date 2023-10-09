// Import necessary modules
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the Car record structure
type Car = Record<{
  id: string;
  name: string;
  model: string;
  cubicCapacityOfEngine: string;
  price: string;
  topSpeed: string;
  companyName: string;
  image: string;
  owner: Principal;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the payload for creating a new Car record
type CarPayload = Record<{
  name: string;
  model: string;
  cubicCapacityOfEngine: string;
  description: string; // Changed 'description' field name
  price: string;
  topSpeed: string;
  companyName: string;
  image: string;
}>;

// Create a storage container for cars
const carStorage = new StableBTreeMap<string, Car>(0, 44, 1024);

// Function to create a new Car record
$update;
export function createCar(payload: CarPayload): Result<Car, string> {
  // Payload validation: Check if required fields in the payload are missing
  if (
    !payload.name ||
    !payload.model ||
    !payload.cubicCapacityOfEngine ||
    !payload.price ||
    !payload.topSpeed ||
    !payload.companyName ||
    !payload.image
  ) {
    return Result.Err<Car, string>("Missing required fields in payload");
  }


  // Create a new Car object by spreading the payload
  const car: Car = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    name: payload.name,
    model: payload.model,
    cubicCapacityOfEngine: payload.cubicCapacityOfEngine,
    price: payload.price,
    topSpeed: payload.topSpeed,
    companyName: payload.companyName,
    image: payload.image,
    owner: ic.caller(),
  };

  try {
    // Insert the new Car record into storage
    carStorage.insert(car.id, car);
  } catch (error) {
    return Result.Err<Car, string>("Error occurred during car insertion");
  }

  return Result.Ok<Car, string>(car);
}

// Function to retrieve a Car by its ID
$query;
export function getCarById(id: string): Result<Car, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<Car, string>(`Invalid id=${id}.`);
  }
  try {
    return match(carStorage.get(id), {
      Some: (car) => Result.Ok<Car, string>(car),
      None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<Car, string>(`Error while retrieving car with id ${id}`);
  }
}

// Function to retrieve a Car by its name (case-insensitive)
$query;
export function getCarByName(name: string): Result<Car, string> {
  const cars = carStorage.values();

  // Case-insensitive search for the car by name
  const foundCar = cars.find((car) => car.name.toLowerCase() === name.toLowerCase());

  if (foundCar) {
    return Result.Ok<Car, string>(foundCar);
  }

  return Result.Err<Car, string>(`Car with name="${name}" not found.`);
}

// Function to retrieve all Cars
$query;
export function getAllCars(): Result<Vec<Car>, string> {
  try {
    return Result.Ok(carStorage.values());
  } catch (error) {
    return Result.Err(`Failed to get all cars: ${error}`);
  }
}

// Function to update a Car record
$update;
export function updateCar(id: string, payload: CarPayload): Result<Car, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<Car, string>('Invalid id.');
  }

  // Payload validation: Check if required fields in the payload are missing
  if (
    !payload.name ||
    !payload.model ||
    !payload.cubicCapacityOfEngine ||
    !payload.price ||
    !payload.topSpeed ||
    !payload.companyName ||
    !payload.image
  ) {
    return Result.Err<Car, string>('Missing required fields in payload.');
  }

  return match(carStorage.get(id), {
    Some: (existingCar) => {
      // Create an updated Car object
      const updatedCar: Car = {
        id: existingCar.id,
        name: payload.name,
        model: payload.model,
        cubicCapacityOfEngine: payload.cubicCapacityOfEngine,
        price: payload.price,
        topSpeed: payload.topSpeed,
        companyName: payload.companyName,
        image: payload.image,
        owner: existingCar.owner,
        createdAt: existingCar.createdAt,
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Update the Car record in storage
        carStorage.insert(updatedCar.id, updatedCar);
        return Result.Ok<Car, string>(updatedCar);
      } catch (error) {
        return Result.Err<Car, string>(`Error updating car: ${error}`);
      }
    },

    None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
  });
}

// Function to delete a Car by its ID
$update;
export function deleteCar(id: string): Result<Car, string> {
  // Parameter validation: Check if ID is invalid or missing
  if (!id) {
    return Result.Err<Car, string>(`Invalid id=${id}.`);
  }
  try {
    return match(carStorage.get(id), {
      Some: (existingCar) => {
        // Check if the caller is the owner of the Car
        if (existingCar.owner.toString() === ic.caller.toString()) {
          return Result.Err<Car, string>("User does not have the right to delete car");
        }

        // Remove the Car from storage
        carStorage.remove(id);
        return Result.Ok<Car, string>(existingCar);
      },
      None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<Car, string>(`Error deleting car with id=${id}: ${error}`);
  }
}

// Set up a random number generator for generating UUIDs
globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
