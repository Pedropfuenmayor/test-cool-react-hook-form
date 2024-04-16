import { zodResolver } from "@hookform/resolvers/zod";
import { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { Controller, SubmitHandler, useForm } from "cool-react-hook-form";
import { z } from "zod";

const schema = z
  .object({
    firstName: z.string().optional(),
    secondName: z.string().optional(),
    secondNameRequired: z.boolean(),
  })
  .superRefine((schema, context) => {
    if (schema.secondNameRequired && !schema.secondName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondName"],
        message: "Second name is required if the checkbox is checked",
      });
    }
  });
type Schema = z.infer<typeof schema>;

export const loader = async () => {
  return {
    firstName: "loader",
    secondName: "data",
    secondNameRequired: true,
  } satisfies Schema;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await request.json();
  const parsedData = schema.safeParse(data);
  if (!parsedData.success) return null;
  return parsedData.data;
};

export default function Fork() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
    getValues,
  } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: loaderData,
  });
  const submit = useSubmit();
  const onSubmit: SubmitHandler<Schema> = (data) =>
    submit(data, { method: "post", encType: "application/json" });

  console.log("firstName", watch("firstName"));
  console.log("secondName", watch("secondName"));

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "500px",
          gap: "5px",
        }}
      >
        <input {...register("firstName")} />
        {errors.firstName && <span>{errors.firstName.message}</span>}
        <input {...register("secondName")} />
        {errors.secondName && <span>{errors.secondName.message}</span>}
        <div style={{ display: "flex", flexDirection: "row" }}>
          <label htmlFor="secondNameRequired">Second name required?</label>
          <input
            id="secondNameRequired"
            type="checkbox"
            {...register("secondNameRequired")}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const firstName = getValues("firstName");
            setValue("secondName", firstName);
          }}
        >
          Set second name to first name
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("secondName", undefined);
          }}
        >
          Set second name to undefined
        </button>
        <input type="submit" />
      </form>
      <h2>Loader data</h2>
      <pre>{JSON.stringify(loaderData, null, 2)}</pre>
      <h2>Action data</h2>
      {actionData && <pre>{JSON.stringify(actionData, null, 2)}</pre>}
    </>
  );
}
