#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float tanc(float x)
{
	return tan(x) / x;
}

mat2 rot2(float a)
{
    mat2 ret = mat2(
        cos(a), sin(a),
        -sin(a), cos(a)
    );

    return ret;
}

mat3 rot3(float a)
{
    mat3 ret = mat3(
        0.0, 0.0, 0.0,
        0.0, cos(a), sin(a),
        0.0, -sin(a), cos(a)
    );

    return ret;
}

vec3 col(vec2 p)
{
	float f = min(abs(uFreq), abs(uLastFreq)) + abs(uDeltaFreq / 2.0);
	//float ft = smoothstep(sin(uTime), sin(f),  uFreq);
    float t = smoothstep(0.0, sin(uTime), uLastFrame);
	float fs = sin(uTime + uFreq) / abs(sin(uTime - uLastFreq) / 2.0);
	float fstep = smoothstep(sin(uFreq / f), uFreq + uLastFreq, uTime);
	float tf = smoothstep(sin(f), 2.0, uTime);

    p *= rot2(uTime + sinc(f));
    float sp = uSpectrum[int(mod(int(length(p + oTexCoord)), 256))];
    
	float r = length(p) * pow(2.0, sin(uTime) - uFreq) * sin(f);
    float theta = atan(p.x, p.y) + sp;

	float s = sin(pow(r, 2.0)) * fs;
	float g = cos(theta) / sin(theta);

	vec3 c = vec3(
		atan(f, sinc(length(p))), 
		pow(f, sinc(uTime / t) / fs) * t,
		sin(fs + sin(sinc(uLastFreq) / tanc(uDeltaTime)))
		);

	float v = 0.1 / abs(s - sin(g)) * f;
	//float v = 0.1 / abs(s - g) * f;
	vec3 ret = sin(v / c) * t;
    ret *= sin(t);

	g = sinc(theta) / cosc(theta);// * t;
	v = 0.1 / abs(s - sin(g)) * f;
	//v *= 0.1 / abs(s - g) * f;
	ret += v / c;

   // ret *= rot3(uTime);
	return ret;// - cos(length(oTexCoord));
}

void main()
{
	vec2 uv = ((gl_FragCoord.xy / uRes.xy) / 2.0 - 0.5);

	vec4 ret;

	ret = vec4(col(sin(uv) * uTime), 1.0);
	retColor = ret;
}