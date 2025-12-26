
import { describe, it, vi, beforeEach, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import {  render, screen, waitFor } from '@testing-library/react';


// ---------- Mock API ---------------------
vi.mock("../../api/hvacConfigApi", () => ({
    createHvacConfig: vi.fn(),
}));

import { createHvacConfig } from '../../api/hvacConfigApi';
import { HvacConfigForm } from './HvacConfigForm';



// ---------- Mock DeviceId fields -----------------------

vi.mock("../DeviceIdFiled/HvacDeviceIdField", () => ({


    default: ({
        id,
        deviceId,
        onDeviceIdChange,
        onCanSaveChange,
    }: any ) => {

        onCanSaveChange(true);

    return(
        <input
            id={id}
            placeholder="__MOCK_DEVICE_ID__"
            aria-label='Device ID'
            value={deviceId}
            onChange={(e) => {
                onDeviceIdChange((e.target as HTMLInputElement).value);

            } }
        />
    )
        },

}));

describe("HvacConfigForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });


it("Submit successfully and reset form", async () => {

    // const logSpy = vi.spyOn(console, 'log');

    const user = userEvent.setup();
    // (createHvacConfig as any).mockResolvedValue({});

    render(<HvacConfigForm />);
    expect(screen.getByPlaceholderText("__MOCK_DEVICE_ID__")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/device id/i), "DEV-001");
    await user.type(screen.getByLabelText(/unit name/i), "Lobby Unit");
    await user.type(screen.getByLabelText(/building/i), "01");
    await user.click(screen.getByRole("button", {name: /add hvac/i}));

    // expect(logSpy).toHaveBeenCalled();

    // console.log("LOG CALL:", logSpy.mock.calls);

    await waitFor(() =>{
       expect(createHvacConfig).toHaveBeenCalledTimes(1);
       }
    );
});

it ("submits when canSubmit is true", async () => {

        const user = userEvent.setup();

        vi.mocked(createHvacConfig).mockResolvedValueOnce(undefined as any);

        render(<HvacConfigForm />);

        
        await user.type(screen.getByLabelText(/device id/i), "1001");
        await user.type(screen.getByLabelText(/unit name/i), "HVAC Unit 1");
        await user.type(screen.getByLabelText(/building/i), "01222");

        await user.selectOptions(screen.getByLabelText(/protocol/i), "MODBUS");

        await user.click(screen.getByRole("button", {name: /add hvac/i}));

        await waitFor(() => {
            expect(createHvacConfig).toHaveBeenCalledTimes(1);
        });

});



// it("blocks submit when deviceId is duplicate", async () => {
    
//           const user = userEvent.setup();
//           render(<HvacConfigForm />);
//           screen.debug();

//           await user.type(screen.getByLabelText(/device id/i), "DUPLICATE");
//           await user.type(screen.getByLabelText(/unit name/i), "Unit");
//           await user.type(screen.getByLabelText(/building/i), "01");

//           await user.click(screen.getByRole("button", {name: /add hvac/i }));

//           expect(createHvacConfig).not.toHaveBeenCalled();
        
// });

// it("shows error when API fails", async () => {
//     const user = userEvent.setup();
//     (createHvacConfig as any).mockRejectedValue(new Error("Network error"));

//     render(<HvacConfigForm />);

//     await user.type(screen.getByLabelText(/device id/i), "DEV-002");
//     await user.type(screen.getByLabelText(/unit name/i), "Unit");
//     await user.type(screen.getByLabelText(/building/i), "B1");

//     await user.click(screen.getByRole("button", { name: /add hvac/i }));

//     expect(await screen.findByText(/network error/i))
//       .toBeInTheDocument();
//   });

//   it("renders BACNET fields only when protocol=BACNET", async () => {
//     const user = userEvent.setup();
//     render(<HvacConfigForm />);

//     await user.selectOptions(
//       screen.getByLabelText(/protocol/i),
//       "BACNET"
//     );

//     expect(screen.getByText(/bacnet configuration/i))
//       .toBeInTheDocument();
//   });

//   it("converts numeric BACNET field to number", async () => {
//     const user = userEvent.setup();
//     (createHvacConfig as any).mockResolvedValue({});

//     render(<HvacConfigForm />);

//     await user.type(screen.getByLabelText(/device id/i), "DEV-003");
//     await user.type(screen.getByLabelText(/unit name/i), "Unit");
//     await user.type(screen.getByLabelText(/building/i), "B1");

//     await user.selectOptions(
//       screen.getByLabelText(/protocol/i),
//       "BACNET"
//     );

//     await user.type(
//       screen.getByLabelText(/device instance/i),
//       "123"
//     );

//     await user.click(screen.getByRole("button", { name: /add hvac/i }));

//     const payload = (createHvacConfig as any).mock.calls[0][0];
//     expect(payload.bacnetDeviceInstance).toBe(123);
//   });

});