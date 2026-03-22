const productRegistryAbi = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'uint256', name: 'productId', type: 'uint256' },
            { indexed: false, internalType: 'string', name: 'productName', type: 'string' },
            { indexed: true, internalType: 'address', name: 'farmer', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }
        ],
        name: 'ProductRegistered',
        type: 'event'
    },
    {
        inputs: [
            { internalType: 'string', name: '_productName', type: 'string' },
            { internalType: 'string', name: '_farmerName', type: 'string' },
            { internalType: 'string', name: '_farmLocation', type: 'string' },
            { internalType: 'uint256', name: '_harvestDate', type: 'uint256' }
        ],
        name: 'registerProduct',
        outputs: [{ internalType: 'uint256', name: 'productId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'getProductCount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
]

export default productRegistryAbi