const { address, both, etherMantissa } = require('../Utils/Ethereum');

const { makeComptroller, makePriceOracle, makeCToken, makeToken } = require('../Utils/Compound');

describe('Comptroller', () => {
  let comptroller;
  let root, accounts;

  beforeEach(async () => {
    [root, ...accounts] = saddle.accounts;
  });

  describe("_setPauseGuardian", () => {
    beforeEach(async () => {
      comptroller = await makeComptroller();
    });

    describe("failing", () => {
      it("emits a failure log if not sent by admin", async () => {
        let result = await send(comptroller, '_setPauseGuardian', [root], {from: accounts[1]});
        expect(result).toHaveTrollFailure('UNAUTHORIZED', 'SET_PAUSE_GUARDIAN_OWNER_CHECK');
      });

      it("does not change the pause guardian", async () => {
        let pauseGuardian = await call(comptroller, 'pauseGuardian');
        expect(pauseGuardian).toEqual(address(0));
        await send(comptroller, '_setPauseGuardian', [root], {from: accounts[1]});

        pauseGuardian = await call(comptroller, 'pauseGuardian');
        expect(pauseGuardian).toEqual(address(0));
      });
    });


    describe('succesfully changing pause guardian', () => {
      let result;

      beforeEach(async () => {
        comptroller = await makeComptroller();

        result = await send(comptroller, '_setPauseGuardian', [accounts[1]]);
      });

      it('emits new pause guardian event', async () => {
        expect(result).toHaveLog(
          'NewPauseGuardian',
          {newPauseGuardian: accounts[1], oldPauseGuardian: address(0)}
        );
      });

      it('changes pending pause guardian', async () => {
        let pauseGuardian = await call(comptroller, 'pauseGuardian');
        expect(pauseGuardian).toEqual(accounts[1]);
      });
    });
  });

  describe('setting paused', () => {
    beforeEach(async () => {
      comptroller = await makeComptroller();
    });

    let methods = ["Borrow", "Mint", "Transfer", "Seize"];
    describe('succeeding', () => {
      let pauseGuardian;
      beforeEach(async () => {
        pauseGuardian = accounts[1];
        await send(comptroller, '_setPauseGuardian', [accounts[1]], {from: root});
      });

      methods.forEach(async (method) => {
        it(`only pause guardian or admin can pause ${method}`, async () => {
          await expect(send(comptroller, `_set${method}Paused`, [true], {from: accounts[2]})).rejects.toRevert("revert only pause guardian and admin can pause");
          await expect(send(comptroller, `_set${method}Paused`, [false], {from: accounts[2]})).rejects.toRevert("revert only pause guardian and admin can pause");
        });

        it(`PauseGuardian can pause of ${method}GuardianPaused`, async () => {
          result = await send(comptroller, `_set${method}Paused`, [true], {from: pauseGuardian});
          expect(result).toHaveLog(`ActionPaused`, {action: method, pauseState: true});

          let camelCase = method.charAt(0).toLowerCase() + method.substring(1);

          state = await call(comptroller, `${camelCase}GuardianPaused`);
          expect(state).toEqual(true);

          await expect(send(comptroller, `_set${method}Paused`, [false], {from: pauseGuardian})).rejects.toRevert("revert only admin can unpause");
          result = await send(comptroller, `_set${method}Paused`, [false]);

          expect(result).toHaveLog(`ActionPaused`, {action: method, pauseState: false});

          state = await call(comptroller, `${camelCase}GuardianPaused`);
          expect(state).toEqual(false);
        });

        it(`pauses ${method}`, async() => {
          await send(comptroller, `_set${method}Paused`, [true], {from: pauseGuardian});

          let camelCase = method.charAt(0).toLowerCase() + method.substring(1);
          switch (method) {
          case "Mint":
            await expect(send(comptroller, `${camelCase}Allowed`, [address(1), address(2), 1])).rejects.toRevert(`revert ${method.toLowerCase()} is paused`);
            break;

          case "Borrow":
            await expect(send(comptroller, `${camelCase}Allowed`, [address(1), address(2), 1])).rejects.toRevert(`revert ${method.toLowerCase()} is paused`);
            break;

          case "Transfer":
            await expect(
              send(comptroller, `${camelCase}Allowed`, [address(1), address(2), address(3), 1])
            ).rejects.toRevert(`revert ${method.toLowerCase()} is paused`);
            break;

          case "Seize":
            await expect(
              send(comptroller, `${camelCase}Allowed`, [address(1), address(2), address(3), address(4), 1])
            ).rejects.toRevert(`revert ${method.toLowerCase()} is paused`);
            break;

          default:
            break;
          }
        });
      });
    });
  });
});
