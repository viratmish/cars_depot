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

type CarPayload = Record<{
  name: string;
  model: string;
  cubicCapacityOfEngine: string;
  description: string;
  price: string;
  topSpeed: string;
  companyName: string;
  image: string;
}>;

const carStorage = new StableBTreeMap<string, Car>(0, 44, 1024);

$update;
export function createCar(payload: CarPayload): Result<Car, string> {
  const car: Car = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
    owner: ic.caller(),
  };

  carStorage.insert(car.id, car);
  return Result.Ok<Car, string>(car);
}

$query;
export function getCarById(id: string): Result<Car, string> {
  return match(carStorage.get(id), {
    Some: (car) => Result.Ok<Car, string>(car),
    None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
  });
}

$query;
export function getCarByName(name: string): Result<Car, string> {
  const cars = carStorage.values();

  const foundCar = cars.find((car) => car.name.toLowerCase() === name.toLowerCase());

  if (foundCar) {
    return Result.Ok<Car, string>(foundCar);
  }

  return Result.Err<Car, string>(`Car with name="${name}" not found.`);
}

$query;
export function getAllCars(): Result<Vec<Car>, string> {
  return Result.Ok(carStorage.values());
}

$update;
export function updateCar(id: string, payload: CarPayload): Result<Car, string> {
  return match(carStorage.get(id), {
    Some: (existingCar) => {
      const updatedCar: Car = {
        ...existingCar,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      carStorage.insert(updatedCar.id, updatedCar);
      return Result.Ok<Car, string>(updatedCar);
    },
    None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
  });
}

$update;
export function deleteCar(id: string): Result<Car, string> {
  return match(carStorage.get(id), {
    Some: (existingCar) => {
      carStorage.remove(id);
      return Result.Ok<Car, string>(existingCar);
    },
    None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
  });
}

$query;
export function searchCarsByCompanyName(companyName: string): Result<Vec<Car>, string> {
  const cars = carStorage.values();
  const matchingCars = cars.filter((car) => car.companyName.toLowerCase() === companyName.toLowerCase());
  return Result.Ok<Vec<Car>, string>(matchingCars);
}

$query;
export function getCarsByOwner(owner: Principal): Result<Vec<Car>, string> {
  const cars = carStorage.values();
  const userCars = cars.filter((car) => Principal.equals(car.owner, owner));
  return Result.Ok<Vec<Car>, string>(userCars);
}

$query;
export function filterCarsByPriceRange(minPrice: string, maxPrice: string): Result<Vec<Car>, string> {
  const cars = carStorage.values();
  const filteredCars = cars.filter((car) => parseFloat(car.price) >= parseFloat(minPrice) && parseFloat(car.price) <= parseFloat(maxPrice));
  return Result.Ok<Vec<Car>, string>(filteredCars);
}

$update;
export function recommendCars(userPreferences: Record<string, string>): Result<Vec<Car>, string> {
  // Implement your recommendation logic here based on user preferences.
  // Return a list of recommended cars.
  // Ensure to handle potential errors gracefully.

  // Example: Return the first N cars from the database (you can replace this with your custom logic).
  const cars = carStorage.values();
  const numberOfCarsToRecommend = 5; // You can adjust this as needed.
  const recommendedCars = cars.slice(0, numberOfCarsToRecommend);

  return Result.Ok<Vec<Car>, string>(recommendedCars);
}

$update;
export function updateCarOwner(id: string, newOwner: Principal): Result<Car, string> {
  return match(carStorage.get(id), {
    Some: (existingCar) => {
      const updatedCar: Car = {
        ...existingCar,
        owner: newOwner,
        updatedAt: Opt.Some(ic.time()),
      };

      carStorage.insert(updatedCar.id, updatedCar);
      return Result.Ok<Car, string>(updatedCar);
    },
    None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
  });
}

$query;
export function getCarHistory(id: string): Result<Vec<Record<string, any>>, string> {
  const car = carStorage.get(id);

  if (car.isSome()) {
    const carRecord = car.unwrap();
    const history: Vec<Record<string, any>> = Vec.pushBack(Vec.create(), {
      owner: carRecord.owner,
      createdAt: carRecord.createdAt,
      updatedAt: carRecord.updatedAt.unwrapOr(null),
    });
    return Result.Ok<Vec<Record<string, any>>, string>(history);
  } else {
    return Result.Err<Vec<Record<string, any>>, string>(`Car with id=${id} not found.`);
  }
}

$query;
export function searchCarsByModel(model: string): Result<Vec<Car>, string> {
  const cars = carStorage.values();
  const matchingCars = cars.filter((car) => car.model.toLowerCase() === model.toLowerCase());
  return Result.Ok<Vec<Car>, string>(matchingCars);
}

$query;
export function getCarByPrice(price: string): Result<Car, string> {
  const cars = carStorage.values();
  const foundCar = cars.find((car) => car.price === price);
  if (foundCar) {
    return Result.Ok<Car, string>(foundCar);
  }
  return Result.Err<Car, string>(`Car with price="${price}" not found.`);
}

$update;
export function updateCarImage(id: string, newImage: string): Result<Car, string> {
  return match(carStorage.get(id), {
    Some: (existingCar) => {
      const updatedCar: Car = {
        ...existingCar,
        image: newImage,
        updatedAt: Opt.Some(ic.time()),
      };
      carStorage.insert(updatedCar.id, updatedCar);
      return Result.Ok<Car, string>(updatedCar);
    },
    None: () => Result.Err<Car, string>(`Car with id=${id} not found.`),
  });
}

$query;
export function getNewestCar(): Result<Car, string> {
  const cars = carStorage.values();
  if (cars.length > 0) {
    const newestCar = cars.reduce((prev, current) =>
      prev.createdAt > current.createdAt ? prev : current
    );
    return Result.Ok<Car, string>(newestCar);
  } else {
    return Result.Err<Car, string>(`No cars found.`);
  }
}

$query;
export function getOldestCar(): Result<Car, string> {
  const cars = carStorage.values();
  if (cars.length > 0) {
    const oldestCar = cars.reduce((prev, current) =>
      prev.createdAt < current.createdAt ? prev : current
    );
    return Result.Ok<Car, string>(oldestCar);
  } else {
    return Result.Err<Car, string>(`No cars found.`);
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
  };
};

  
  // Car_Bazar is a dynamic TypeScript web application designed to revolutionize the way you manage and discover cars. Our project empowers users to seamlessly perform CRUD (Create, Read, Update, Delete) operations on cars while providing personalized car recommendations based on user preferences.