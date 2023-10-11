import {
  $update,
  $query,
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

type Car = Record<{
  id: string;
  name: string;
  model: string;
  cubicCapacityOfEngine: number;
  price: number;
  topSpeed: number;
  companyName: string;
  image: string;
  owner: Principal;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type CarPayload = Record<{
  name: string;
  model: string;
  cubicCapacityOfEngine: number;
  description: string;
  price: number;
  topSpeed: number;
  companyName: string;
  image: string;
}>;

const carStorage = new StableBTreeMap<string, Car>(0, 44, 1024);

/**
 * Create a new car.
 * @param payload - CarPayload object containing car details.
 * @returns Result containing the new car or an error message.
 */
export function createCar(payload: CarPayload): Result<Car, string> {
  try {
    const car: Car = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      ...payload,
      owner: ic.caller(),
    };

    carStorage.insert(car.id, car);
    return Result.Ok<Car, string>(car);
  } catch (error) {
    return Result.Err<Car, string>(`Failed to create a new car: ${error.message}`);
  }
}

/**
 * Get a car by its ID.
 * @param id - The ID of the car to retrieve.
 * @returns Result containing the car or an error message if not found.
 */
export function getCarById(id: string): Result<Car, string> {
  const car = carStorage.get(id);
  if (car) {
    return Result.Ok<Car, string>(car);
  } else {
    return Result.Err<Car, string>(`Car with id=${id} not found.`);
  }
}

/**
 * Get a car by its name.
 * @param name - The name of the car to search for.
 * @returns Result containing the car or an error message if not found.
 */
export function getCarByName(name: string): Result<Car, string> {
  const cars = carStorage.values();
  const foundCar = cars.find((car) => car.name.toLowerCase() === name.toLowerCase());

  if (foundCar) {
    return Result.Ok<Car, string>(foundCar);
  } else {
    return Result.Err<Car, string>(`Car with name="${name}" not found.`);
  }
}

/**
 * Get all cars.
 * @returns Result containing a Vec of cars or an error message.
 */
export function getAllCars(): Result<Vec<Car>, string> {
  const cars = carStorage.values();
  return Result.Ok(cars);
}

/**
 * Update a car by its ID.
 * @param id - The ID of the car to update.
 * @param payload - CarPayload object containing updated car details.
 * @returns Result containing the updated car or an error message.
 */
export function updateCar(id: string, payload: CarPayload): Result<Car, string> {
  try {
    const existingCar = carStorage.get(id);

    if (existingCar) {
      const updatedCar: Car = {
        ...existingCar,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      carStorage.insert(updatedCar.id, updatedCar);
      return Result.Ok<Car, string>(updatedCar);
    } else {
      return Result.Err<Car, string>(`Car with id=${id} not found.`);
    }
  } catch (error) {
    return Result.Err<Car, string>(`Failed to update the car: ${error.message}`);
  }
}

/**
 * Delete a car by its ID.
 * @param id - The ID of the car to delete.
 * @returns Result containing the deleted car or an error message.
 */
export function deleteCar(id: string): Result<Car, string> {
  const existingCar = carStorage.get(id);

  if (existingCar) {
    carStorage.remove(id);
    return Result.Ok<Car, string>(existingCar);
  } else {
    return Result.Err<Car, string>(`Car with id=${id} not found.`);
  }
}

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

// Car_Bazar is a dynamic TypeScript web application designed to revolutionize the way you manage and discover cars. Our project empowers users to seamlessly perform CRUD (Create, Read, Update, Delete) operations on cars while providing personalized car recommendations based on user preferences.
