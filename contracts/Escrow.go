// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package contracts

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// EscrowRecord is an auto generated low-level Go binding around an user-defined struct.
type EscrowRecord struct {
	Buyer  common.Address
	Seller common.Address
	Amount *big.Int
	Status uint8
	Exists bool
}

// ContractsMetaData contains all meta data concerning the Contracts contract.
var ContractsMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"buyer\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"seller\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"EscrowCreated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"enumEscrow.Status\",\"name\":\"status\",\"type\":\"uint8\"}],\"name\":\"EscrowFinalized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"enumEscrow.Status\",\"name\":\"status\",\"type\":\"uint8\"}],\"name\":\"PaymentConfirmed\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"}],\"name\":\"confirmPayment\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"buyer\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"seller\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"createEscrow\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"escrows\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"buyer\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"seller\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"enumEscrow.Status\",\"name\":\"status\",\"type\":\"uint8\"},{\"internalType\":\"bool\",\"name\":\"exists\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"}],\"name\":\"finalizeEscrow\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"id\",\"type\":\"uint256\"}],\"name\":\"getEscrow\",\"outputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"buyer\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"seller\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"enumEscrow.Status\",\"name\":\"status\",\"type\":\"uint8\"},{\"internalType\":\"bool\",\"name\":\"exists\",\"type\":\"bool\"}],\"internalType\":\"structEscrow.Record\",\"name\":\"\",\"type\":\"tuple\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"nextId\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
	Bin: "0x6080604052600180553480156012575f5ffd5b50610d04806100205f395ff3fe608060405234801561000f575f5ffd5b5060043610610060575f3560e01c8063012f52ee1461006457806361b8ce8c146100985780637d19e596146100b6578063876ca09f146100e6578063b43a405a14610102578063c36176501461011e575b5f5ffd5b61007e60048036038101906100799190610887565b61014e565b60405161008f95949392919061098d565b60405180910390f35b6100a06101d6565b6040516100ad91906109de565b60405180910390f35b6100d060048036038101906100cb9190610887565b6101dc565b6040516100dd9190610a99565b60405180910390f35b61010060048036038101906100fb9190610887565b61036e565b005b61011c60048036038101906101179190610887565b6104ca565b005b61013860048036038101906101339190610adc565b610627565b60405161014591906109de565b60405180910390f35b5f602052805f5260405f205f91509050805f015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690806001015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690806002015490806003015f9054906101000a900460ff16908060030160019054906101000a900460ff16905085565b60015481565b6101e46107e6565b5f5f8381526020019081526020015f2060030160019054906101000a900460ff16610244576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161023b90610b86565b60405180910390fd5b5f5f8381526020019081526020015f206040518060a00160405290815f82015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001600182015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200160028201548152602001600382015f9054906101000a900460ff16600281111561033657610335610900565b5b600281111561034857610347610900565b5b81526020016003820160019054906101000a900460ff1615151515815250509050919050565b5f5f8281526020019081526020015f2060030160019054906101000a900460ff166103ce576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103c590610b86565b60405180910390fd5b5f60028111156103e1576103e0610900565b5b5f5f8381526020019081526020015f206003015f9054906101000a900460ff16600281111561041357610412610900565b5b14610453576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161044a90610bee565b60405180910390fd5b60015f5f8381526020019081526020015f206003015f6101000a81548160ff0219169083600281111561048957610488610900565b5b0217905550807f3b0a85ee8d6bba1a181a05a3591e9612fe7bae220ce385bd5f0243dd572e408360016040516104bf9190610c0c565b60405180910390a250565b5f5f8281526020019081526020015f2060030160019054906101000a900460ff1661052a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161052190610b86565b60405180910390fd5b6001600281111561053e5761053d610900565b5b5f5f8381526020019081526020015f206003015f9054906101000a900460ff1660028111156105705761056f610900565b5b146105b0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105a790610bee565b60405180910390fd5b60025f5f8381526020019081526020015f206003015f6101000a81548160ff021916908360028111156105e6576105e5610900565b5b0217905550807f58662431db13314bc9b8be8c45dc7f1cec31ef5b18d41c6a5a76d03389c84ec6600260405161061c9190610c0c565b60405180910390a250565b5f5f60015f81548092919061063b90610c52565b9190505590506040518060a001604052808673ffffffffffffffffffffffffffffffffffffffff1681526020018573ffffffffffffffffffffffffffffffffffffffff1681526020018481526020015f600281111561069d5761069c610900565b5b8152602001600115158152505f5f8381526020019081526020015f205f820151815f015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506020820151816001015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550604082015181600201556060820151816003015f6101000a81548160ff0219169083600281111561077757610776610900565b5b021790555060808201518160030160016101000a81548160ff021916908315150217905550905050807f9405ad0a6208539879349284d71265479b1623846f70303da1f9890d6e8c10a78686866040516107d393929190610c99565b60405180910390a2809150509392505050565b6040518060a001604052805f73ffffffffffffffffffffffffffffffffffffffff1681526020015f73ffffffffffffffffffffffffffffffffffffffff1681526020015f81526020015f600281111561084257610841610900565b5b81526020015f151581525090565b5f5ffd5b5f819050919050565b61086681610854565b8114610870575f5ffd5b50565b5f813590506108818161085d565b92915050565b5f6020828403121561089c5761089b610850565b5b5f6108a984828501610873565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6108db826108b2565b9050919050565b6108eb816108d1565b82525050565b6108fa81610854565b82525050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602160045260245ffd5b6003811061093e5761093d610900565b5b50565b5f81905061094e8261092d565b919050565b5f61095d82610941565b9050919050565b61096d81610953565b82525050565b5f8115159050919050565b61098781610973565b82525050565b5f60a0820190506109a05f8301886108e2565b6109ad60208301876108e2565b6109ba60408301866108f1565b6109c76060830185610964565b6109d4608083018461097e565b9695505050505050565b5f6020820190506109f15f8301846108f1565b92915050565b610a00816108d1565b82525050565b610a0f81610854565b82525050565b610a1e81610953565b82525050565b610a2d81610973565b82525050565b60a082015f820151610a475f8501826109f7565b506020820151610a5a60208501826109f7565b506040820151610a6d6040850182610a06565b506060820151610a806060850182610a15565b506080820151610a936080850182610a24565b50505050565b5f60a082019050610aac5f830184610a33565b92915050565b610abb816108d1565b8114610ac5575f5ffd5b50565b5f81359050610ad681610ab2565b92915050565b5f5f5f60608486031215610af357610af2610850565b5b5f610b0086828701610ac8565b9350506020610b1186828701610ac8565b9250506040610b2286828701610873565b9150509250925092565b5f82825260208201905092915050565b7f457363726f7720646f6573206e6f7420657869737400000000000000000000005f82015250565b5f610b70601583610b2c565b9150610b7b82610b3c565b602082019050919050565b5f6020820190508181035f830152610b9d81610b64565b9050919050565b7f496e76616c6964207374617475730000000000000000000000000000000000005f82015250565b5f610bd8600e83610b2c565b9150610be382610ba4565b602082019050919050565b5f6020820190508181035f830152610c0581610bcc565b9050919050565b5f602082019050610c1f5f830184610964565b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610c5c82610854565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203610c8e57610c8d610c25565b5b600182019050919050565b5f606082019050610cac5f8301866108e2565b610cb960208301856108e2565b610cc660408301846108f1565b94935050505056fea2646970667358221220132889e5ab5d097b54e4731eff1f1c1237a85356092f7ceb639561f3b485ccda64736f6c634300081e0033",
}

// ContractsABI is the input ABI used to generate the binding from.
// Deprecated: Use ContractsMetaData.ABI instead.
var ContractsABI = ContractsMetaData.ABI

// ContractsBin is the compiled bytecode used for deploying new contracts.
// Deprecated: Use ContractsMetaData.Bin instead.
var ContractsBin = ContractsMetaData.Bin

// DeployContracts deploys a new Ethereum contract, binding an instance of Contracts to it.
func DeployContracts(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *Contracts, error) {
	parsed, err := ContractsMetaData.GetAbi()
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	if parsed == nil {
		return common.Address{}, nil, nil, errors.New("GetABI returned nil")
	}

	address, tx, contract, err := bind.DeployContract(auth, *parsed, common.FromHex(ContractsBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &Contracts{ContractsCaller: ContractsCaller{contract: contract}, ContractsTransactor: ContractsTransactor{contract: contract}, ContractsFilterer: ContractsFilterer{contract: contract}}, nil
}

// Contracts is an auto generated Go binding around an Ethereum contract.
type Contracts struct {
	ContractsCaller     // Read-only binding to the contract
	ContractsTransactor // Write-only binding to the contract
	ContractsFilterer   // Log filterer for contract events
}

// ContractsCaller is an auto generated read-only Go binding around an Ethereum contract.
type ContractsCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ContractsTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ContractsTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ContractsFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ContractsFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ContractsSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ContractsSession struct {
	Contract     *Contracts        // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// ContractsCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ContractsCallerSession struct {
	Contract *ContractsCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts    // Call options to use throughout this session
}

// ContractsTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ContractsTransactorSession struct {
	Contract     *ContractsTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts    // Transaction auth options to use throughout this session
}

// ContractsRaw is an auto generated low-level Go binding around an Ethereum contract.
type ContractsRaw struct {
	Contract *Contracts // Generic contract binding to access the raw methods on
}

// ContractsCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ContractsCallerRaw struct {
	Contract *ContractsCaller // Generic read-only contract binding to access the raw methods on
}

// ContractsTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ContractsTransactorRaw struct {
	Contract *ContractsTransactor // Generic write-only contract binding to access the raw methods on
}

// NewContracts creates a new instance of Contracts, bound to a specific deployed contract.
func NewContracts(address common.Address, backend bind.ContractBackend) (*Contracts, error) {
	contract, err := bindContracts(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Contracts{ContractsCaller: ContractsCaller{contract: contract}, ContractsTransactor: ContractsTransactor{contract: contract}, ContractsFilterer: ContractsFilterer{contract: contract}}, nil
}

// NewContractsCaller creates a new read-only instance of Contracts, bound to a specific deployed contract.
func NewContractsCaller(address common.Address, caller bind.ContractCaller) (*ContractsCaller, error) {
	contract, err := bindContracts(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ContractsCaller{contract: contract}, nil
}

// NewContractsTransactor creates a new write-only instance of Contracts, bound to a specific deployed contract.
func NewContractsTransactor(address common.Address, transactor bind.ContractTransactor) (*ContractsTransactor, error) {
	contract, err := bindContracts(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ContractsTransactor{contract: contract}, nil
}

// NewContractsFilterer creates a new log filterer instance of Contracts, bound to a specific deployed contract.
func NewContractsFilterer(address common.Address, filterer bind.ContractFilterer) (*ContractsFilterer, error) {
	contract, err := bindContracts(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ContractsFilterer{contract: contract}, nil
}

// bindContracts binds a generic wrapper to an already deployed contract.
func bindContracts(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := ContractsMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Contracts *ContractsRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Contracts.Contract.ContractsCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Contracts *ContractsRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contracts.Contract.ContractsTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Contracts *ContractsRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Contracts.Contract.ContractsTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Contracts *ContractsCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Contracts.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Contracts *ContractsTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Contracts.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Contracts *ContractsTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Contracts.Contract.contract.Transact(opts, method, params...)
}

// Escrows is a free data retrieval call binding the contract method 0x012f52ee.
//
// Solidity: function escrows(uint256 ) view returns(address buyer, address seller, uint256 amount, uint8 status, bool exists)
func (_Contracts *ContractsCaller) Escrows(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Buyer  common.Address
	Seller common.Address
	Amount *big.Int
	Status uint8
	Exists bool
}, error) {
	var out []interface{}
	err := _Contracts.contract.Call(opts, &out, "escrows", arg0)

	outstruct := new(struct {
		Buyer  common.Address
		Seller common.Address
		Amount *big.Int
		Status uint8
		Exists bool
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Buyer = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.Seller = *abi.ConvertType(out[1], new(common.Address)).(*common.Address)
	outstruct.Amount = *abi.ConvertType(out[2], new(*big.Int)).(**big.Int)
	outstruct.Status = *abi.ConvertType(out[3], new(uint8)).(*uint8)
	outstruct.Exists = *abi.ConvertType(out[4], new(bool)).(*bool)

	return *outstruct, err

}

// Escrows is a free data retrieval call binding the contract method 0x012f52ee.
//
// Solidity: function escrows(uint256 ) view returns(address buyer, address seller, uint256 amount, uint8 status, bool exists)
func (_Contracts *ContractsSession) Escrows(arg0 *big.Int) (struct {
	Buyer  common.Address
	Seller common.Address
	Amount *big.Int
	Status uint8
	Exists bool
}, error) {
	return _Contracts.Contract.Escrows(&_Contracts.CallOpts, arg0)
}

// Escrows is a free data retrieval call binding the contract method 0x012f52ee.
//
// Solidity: function escrows(uint256 ) view returns(address buyer, address seller, uint256 amount, uint8 status, bool exists)
func (_Contracts *ContractsCallerSession) Escrows(arg0 *big.Int) (struct {
	Buyer  common.Address
	Seller common.Address
	Amount *big.Int
	Status uint8
	Exists bool
}, error) {
	return _Contracts.Contract.Escrows(&_Contracts.CallOpts, arg0)
}

// GetEscrow is a free data retrieval call binding the contract method 0x7d19e596.
//
// Solidity: function getEscrow(uint256 id) view returns((address,address,uint256,uint8,bool))
func (_Contracts *ContractsCaller) GetEscrow(opts *bind.CallOpts, id *big.Int) (EscrowRecord, error) {
	var out []interface{}
	err := _Contracts.contract.Call(opts, &out, "getEscrow", id)

	if err != nil {
		return *new(EscrowRecord), err
	}

	out0 := *abi.ConvertType(out[0], new(EscrowRecord)).(*EscrowRecord)

	return out0, err

}

// GetEscrow is a free data retrieval call binding the contract method 0x7d19e596.
//
// Solidity: function getEscrow(uint256 id) view returns((address,address,uint256,uint8,bool))
func (_Contracts *ContractsSession) GetEscrow(id *big.Int) (EscrowRecord, error) {
	return _Contracts.Contract.GetEscrow(&_Contracts.CallOpts, id)
}

// GetEscrow is a free data retrieval call binding the contract method 0x7d19e596.
//
// Solidity: function getEscrow(uint256 id) view returns((address,address,uint256,uint8,bool))
func (_Contracts *ContractsCallerSession) GetEscrow(id *big.Int) (EscrowRecord, error) {
	return _Contracts.Contract.GetEscrow(&_Contracts.CallOpts, id)
}

// NextId is a free data retrieval call binding the contract method 0x61b8ce8c.
//
// Solidity: function nextId() view returns(uint256)
func (_Contracts *ContractsCaller) NextId(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Contracts.contract.Call(opts, &out, "nextId")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// NextId is a free data retrieval call binding the contract method 0x61b8ce8c.
//
// Solidity: function nextId() view returns(uint256)
func (_Contracts *ContractsSession) NextId() (*big.Int, error) {
	return _Contracts.Contract.NextId(&_Contracts.CallOpts)
}

// NextId is a free data retrieval call binding the contract method 0x61b8ce8c.
//
// Solidity: function nextId() view returns(uint256)
func (_Contracts *ContractsCallerSession) NextId() (*big.Int, error) {
	return _Contracts.Contract.NextId(&_Contracts.CallOpts)
}

// ConfirmPayment is a paid mutator transaction binding the contract method 0x876ca09f.
//
// Solidity: function confirmPayment(uint256 id) returns()
func (_Contracts *ContractsTransactor) ConfirmPayment(opts *bind.TransactOpts, id *big.Int) (*types.Transaction, error) {
	return _Contracts.contract.Transact(opts, "confirmPayment", id)
}

// ConfirmPayment is a paid mutator transaction binding the contract method 0x876ca09f.
//
// Solidity: function confirmPayment(uint256 id) returns()
func (_Contracts *ContractsSession) ConfirmPayment(id *big.Int) (*types.Transaction, error) {
	return _Contracts.Contract.ConfirmPayment(&_Contracts.TransactOpts, id)
}

// ConfirmPayment is a paid mutator transaction binding the contract method 0x876ca09f.
//
// Solidity: function confirmPayment(uint256 id) returns()
func (_Contracts *ContractsTransactorSession) ConfirmPayment(id *big.Int) (*types.Transaction, error) {
	return _Contracts.Contract.ConfirmPayment(&_Contracts.TransactOpts, id)
}

// CreateEscrow is a paid mutator transaction binding the contract method 0xc3617650.
//
// Solidity: function createEscrow(address buyer, address seller, uint256 amount) returns(uint256)
func (_Contracts *ContractsTransactor) CreateEscrow(opts *bind.TransactOpts, buyer common.Address, seller common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contracts.contract.Transact(opts, "createEscrow", buyer, seller, amount)
}

// CreateEscrow is a paid mutator transaction binding the contract method 0xc3617650.
//
// Solidity: function createEscrow(address buyer, address seller, uint256 amount) returns(uint256)
func (_Contracts *ContractsSession) CreateEscrow(buyer common.Address, seller common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contracts.Contract.CreateEscrow(&_Contracts.TransactOpts, buyer, seller, amount)
}

// CreateEscrow is a paid mutator transaction binding the contract method 0xc3617650.
//
// Solidity: function createEscrow(address buyer, address seller, uint256 amount) returns(uint256)
func (_Contracts *ContractsTransactorSession) CreateEscrow(buyer common.Address, seller common.Address, amount *big.Int) (*types.Transaction, error) {
	return _Contracts.Contract.CreateEscrow(&_Contracts.TransactOpts, buyer, seller, amount)
}

// FinalizeEscrow is a paid mutator transaction binding the contract method 0xb43a405a.
//
// Solidity: function finalizeEscrow(uint256 id) returns()
func (_Contracts *ContractsTransactor) FinalizeEscrow(opts *bind.TransactOpts, id *big.Int) (*types.Transaction, error) {
	return _Contracts.contract.Transact(opts, "finalizeEscrow", id)
}

// FinalizeEscrow is a paid mutator transaction binding the contract method 0xb43a405a.
//
// Solidity: function finalizeEscrow(uint256 id) returns()
func (_Contracts *ContractsSession) FinalizeEscrow(id *big.Int) (*types.Transaction, error) {
	return _Contracts.Contract.FinalizeEscrow(&_Contracts.TransactOpts, id)
}

// FinalizeEscrow is a paid mutator transaction binding the contract method 0xb43a405a.
//
// Solidity: function finalizeEscrow(uint256 id) returns()
func (_Contracts *ContractsTransactorSession) FinalizeEscrow(id *big.Int) (*types.Transaction, error) {
	return _Contracts.Contract.FinalizeEscrow(&_Contracts.TransactOpts, id)
}

// ContractsEscrowCreatedIterator is returned from FilterEscrowCreated and is used to iterate over the raw logs and unpacked data for EscrowCreated events raised by the Contracts contract.
type ContractsEscrowCreatedIterator struct {
	Event *ContractsEscrowCreated // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *ContractsEscrowCreatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractsEscrowCreated)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(ContractsEscrowCreated)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *ContractsEscrowCreatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ContractsEscrowCreatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ContractsEscrowCreated represents a EscrowCreated event raised by the Contracts contract.
type ContractsEscrowCreated struct {
	Id     *big.Int
	Buyer  common.Address
	Seller common.Address
	Amount *big.Int
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterEscrowCreated is a free log retrieval operation binding the contract event 0x9405ad0a6208539879349284d71265479b1623846f70303da1f9890d6e8c10a7.
//
// Solidity: event EscrowCreated(uint256 indexed id, address buyer, address seller, uint256 amount)
func (_Contracts *ContractsFilterer) FilterEscrowCreated(opts *bind.FilterOpts, id []*big.Int) (*ContractsEscrowCreatedIterator, error) {

	var idRule []interface{}
	for _, idItem := range id {
		idRule = append(idRule, idItem)
	}

	logs, sub, err := _Contracts.contract.FilterLogs(opts, "EscrowCreated", idRule)
	if err != nil {
		return nil, err
	}
	return &ContractsEscrowCreatedIterator{contract: _Contracts.contract, event: "EscrowCreated", logs: logs, sub: sub}, nil
}

// WatchEscrowCreated is a free log subscription operation binding the contract event 0x9405ad0a6208539879349284d71265479b1623846f70303da1f9890d6e8c10a7.
//
// Solidity: event EscrowCreated(uint256 indexed id, address buyer, address seller, uint256 amount)
func (_Contracts *ContractsFilterer) WatchEscrowCreated(opts *bind.WatchOpts, sink chan<- *ContractsEscrowCreated, id []*big.Int) (event.Subscription, error) {

	var idRule []interface{}
	for _, idItem := range id {
		idRule = append(idRule, idItem)
	}

	logs, sub, err := _Contracts.contract.WatchLogs(opts, "EscrowCreated", idRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ContractsEscrowCreated)
				if err := _Contracts.contract.UnpackLog(event, "EscrowCreated", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseEscrowCreated is a log parse operation binding the contract event 0x9405ad0a6208539879349284d71265479b1623846f70303da1f9890d6e8c10a7.
//
// Solidity: event EscrowCreated(uint256 indexed id, address buyer, address seller, uint256 amount)
func (_Contracts *ContractsFilterer) ParseEscrowCreated(log types.Log) (*ContractsEscrowCreated, error) {
	event := new(ContractsEscrowCreated)
	if err := _Contracts.contract.UnpackLog(event, "EscrowCreated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ContractsEscrowFinalizedIterator is returned from FilterEscrowFinalized and is used to iterate over the raw logs and unpacked data for EscrowFinalized events raised by the Contracts contract.
type ContractsEscrowFinalizedIterator struct {
	Event *ContractsEscrowFinalized // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *ContractsEscrowFinalizedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractsEscrowFinalized)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(ContractsEscrowFinalized)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *ContractsEscrowFinalizedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ContractsEscrowFinalizedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ContractsEscrowFinalized represents a EscrowFinalized event raised by the Contracts contract.
type ContractsEscrowFinalized struct {
	Id     *big.Int
	Status uint8
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterEscrowFinalized is a free log retrieval operation binding the contract event 0x58662431db13314bc9b8be8c45dc7f1cec31ef5b18d41c6a5a76d03389c84ec6.
//
// Solidity: event EscrowFinalized(uint256 indexed id, uint8 status)
func (_Contracts *ContractsFilterer) FilterEscrowFinalized(opts *bind.FilterOpts, id []*big.Int) (*ContractsEscrowFinalizedIterator, error) {

	var idRule []interface{}
	for _, idItem := range id {
		idRule = append(idRule, idItem)
	}

	logs, sub, err := _Contracts.contract.FilterLogs(opts, "EscrowFinalized", idRule)
	if err != nil {
		return nil, err
	}
	return &ContractsEscrowFinalizedIterator{contract: _Contracts.contract, event: "EscrowFinalized", logs: logs, sub: sub}, nil
}

// WatchEscrowFinalized is a free log subscription operation binding the contract event 0x58662431db13314bc9b8be8c45dc7f1cec31ef5b18d41c6a5a76d03389c84ec6.
//
// Solidity: event EscrowFinalized(uint256 indexed id, uint8 status)
func (_Contracts *ContractsFilterer) WatchEscrowFinalized(opts *bind.WatchOpts, sink chan<- *ContractsEscrowFinalized, id []*big.Int) (event.Subscription, error) {

	var idRule []interface{}
	for _, idItem := range id {
		idRule = append(idRule, idItem)
	}

	logs, sub, err := _Contracts.contract.WatchLogs(opts, "EscrowFinalized", idRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ContractsEscrowFinalized)
				if err := _Contracts.contract.UnpackLog(event, "EscrowFinalized", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseEscrowFinalized is a log parse operation binding the contract event 0x58662431db13314bc9b8be8c45dc7f1cec31ef5b18d41c6a5a76d03389c84ec6.
//
// Solidity: event EscrowFinalized(uint256 indexed id, uint8 status)
func (_Contracts *ContractsFilterer) ParseEscrowFinalized(log types.Log) (*ContractsEscrowFinalized, error) {
	event := new(ContractsEscrowFinalized)
	if err := _Contracts.contract.UnpackLog(event, "EscrowFinalized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// ContractsPaymentConfirmedIterator is returned from FilterPaymentConfirmed and is used to iterate over the raw logs and unpacked data for PaymentConfirmed events raised by the Contracts contract.
type ContractsPaymentConfirmedIterator struct {
	Event *ContractsPaymentConfirmed // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *ContractsPaymentConfirmedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(ContractsPaymentConfirmed)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(ContractsPaymentConfirmed)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *ContractsPaymentConfirmedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *ContractsPaymentConfirmedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// ContractsPaymentConfirmed represents a PaymentConfirmed event raised by the Contracts contract.
type ContractsPaymentConfirmed struct {
	Id     *big.Int
	Status uint8
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterPaymentConfirmed is a free log retrieval operation binding the contract event 0x3b0a85ee8d6bba1a181a05a3591e9612fe7bae220ce385bd5f0243dd572e4083.
//
// Solidity: event PaymentConfirmed(uint256 indexed id, uint8 status)
func (_Contracts *ContractsFilterer) FilterPaymentConfirmed(opts *bind.FilterOpts, id []*big.Int) (*ContractsPaymentConfirmedIterator, error) {

	var idRule []interface{}
	for _, idItem := range id {
		idRule = append(idRule, idItem)
	}

	logs, sub, err := _Contracts.contract.FilterLogs(opts, "PaymentConfirmed", idRule)
	if err != nil {
		return nil, err
	}
	return &ContractsPaymentConfirmedIterator{contract: _Contracts.contract, event: "PaymentConfirmed", logs: logs, sub: sub}, nil
}

// WatchPaymentConfirmed is a free log subscription operation binding the contract event 0x3b0a85ee8d6bba1a181a05a3591e9612fe7bae220ce385bd5f0243dd572e4083.
//
// Solidity: event PaymentConfirmed(uint256 indexed id, uint8 status)
func (_Contracts *ContractsFilterer) WatchPaymentConfirmed(opts *bind.WatchOpts, sink chan<- *ContractsPaymentConfirmed, id []*big.Int) (event.Subscription, error) {

	var idRule []interface{}
	for _, idItem := range id {
		idRule = append(idRule, idItem)
	}

	logs, sub, err := _Contracts.contract.WatchLogs(opts, "PaymentConfirmed", idRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(ContractsPaymentConfirmed)
				if err := _Contracts.contract.UnpackLog(event, "PaymentConfirmed", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParsePaymentConfirmed is a log parse operation binding the contract event 0x3b0a85ee8d6bba1a181a05a3591e9612fe7bae220ce385bd5f0243dd572e4083.
//
// Solidity: event PaymentConfirmed(uint256 indexed id, uint8 status)
func (_Contracts *ContractsFilterer) ParsePaymentConfirmed(log types.Log) (*ContractsPaymentConfirmed, error) {
	event := new(ContractsPaymentConfirmed)
	if err := _Contracts.contract.UnpackLog(event, "PaymentConfirmed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
