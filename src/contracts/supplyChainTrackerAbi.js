const supplyChainTrackerAbi = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'productId', type: 'uint256' },
            { indexed: false, internalType: 'uint8', name: 'stage', type: 'uint8' },
            { indexed: true, internalType: 'address', name: 'handler', type: 'address' },
            { indexed: false, internalType: 'string', name: 'location', type: 'string' },
            { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }
        ],
        name: 'ProductTransferred',
        type: 'event'
    },
    {
        inputs: [
            { internalType: 'uint256', name: '_productId', type: 'uint256' },
            { internalType: 'uint8', name: '_stage', type: 'uint8' },
            { internalType: 'string', name: '_location', type: 'string' },
            { internalType: 'int16', name: '_temperature', type: 'int16' },
            { internalType: 'uint16', name: '_humidity', type: 'uint16' }
        ],
        name: 'logTransfer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
]

export default supplyChainTrackerAbi