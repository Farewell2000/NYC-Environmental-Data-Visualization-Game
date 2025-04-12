// New function to get dialogue based on tree data
export function getTreeDialogue(treeData) {
    const status = treeData.status?.toLowerCase() || 'unknown';
    const commonName = treeData.spc_common && treeData.spc_common.toLowerCase() !== 'unknown' && treeData.spc_common.toLowerCase() !== 'none' ? treeData.spc_common : 'this tree';
    let baseDialogue = '';

    switch (status) {
        case 'good':
            baseDialogue = `This ${commonName} looks healthy! It's thriving here.`;
            break;
        case 'fair':
            baseDialogue = `This ${commonName} seems okay, but could be better.`;
            break;
        case 'poor':
            baseDialogue = `Oh dear, this ${commonName} isn't doing well.`;
            break;
        default:
            baseDialogue = `Here's a ${commonName}. Its status is unclear.`;
    }
    return baseDialogue;
}

// New function for borough clicks during noise task
export function getBoroughDialogue(boroughName) {
    return `You've selected ${boroughName}. Check the noise complaint data. What patterns do you observe?`;
}
