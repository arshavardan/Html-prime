interface IEndpoint {
  id: number;
  name: string;
  shortName: string;
  url: string;
  username: string;
  password: string;
  availableClusters: Array<string>;
}
