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

uniform float[256] uSpectrum;

uniform vec2 uRes;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

float hash(float n)
{
	float ret = fract(sin(n) * 43758.5433);

	return ret;
}

float noise(vec2 x)
{
	vec2 p = floor(x);
	vec2 f = fract(x);

	f = f * f * (3.0 - 2.0 * f);

	float n = p.x + p.y * 57.0;

	float ret = mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
					mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);

	return ret;
}

mat2 m = mat2(
	0.8, 0.6,
	-0.6, 0.8
);

float fbm(vec2 p)
{
	float f = 0.0;

	f += 0.5000 * noise(p);
	p *= m * 2.02;
	
	f += 0.2500 * noise(p);
	p *= m * 2.03;

	f += 0.1250 * noise(p);
	p *= m * 2.01;

	f += 0.0625 * noise(p);
	p *=  m * 2.04;

	f /= 0.9375;

	return f;
}

vec2 rz(vec2 z)
{
	vec2 sum = vec2(0);
	for (float i = 1.0; i < 256; i++)
	{
		sum += 
			sin(-z.y * log(i) - 
			//vec2(1.57, 0.0)) 
			vec2(mod(uFreq, uLastFreq) * uSpectrum[int(i)], 0.0))
			/ pow(i, z.x);
	}

	return sum;
}

float wiggle(vec2 p, float r)
{
	float d = length(p * m);
	float beat =  pow(sinc(uFreq * PI * 3.78 + 1.9) * 0.5 + 0.5, 15.0) * 0.1;
	d += beat * 2.0 *(sinc(p.y * 0.25 / (uRes.y / 50) + uTime * cosc(uFreq)) * sinc(p.x * 0.25 / (uRes.y / 50.0) + uTime * .5 * cosc(uFreq))) * (uRes.y / 50.0) * 5.0;

	float v = mod(d + r / 20.0, r / 20.0);
	v = abs(v - r / 20.0);

	vec3 m = fract((d - 1.0) * vec3(10.0, -20.0, 5.0) * 0.5);

	return sin(length(m * sinc(v))) ;
}

vec3 eye(vec2 uv)
{
	vec2 q = uv;//gl_FragCoord.xy / uRes;
	//vec2 p = -0.5 + q * 2.5;
	vec2 p = q;
	//p.x *= uRes.x / uRes.y;

	float bg = 1.0;

	//p -= 0.9;
	//p.x -= 2.5;
	//p.y -= 0.75;
	float r = sqrt(dot(p, p));
	float a = atan(p.y, p.x);

	vec3 col = vec3(0.0);

	float ss = 0.5 + uFreq * sin(80.0 * smoothstep(uFreq, uLastFreq, uTime));
	float anim = 1.0 + 0.1 * ss * clamp(1.0 - r, 0.0, 1.0);
	//r *= anim;
	r *= wiggle(p / uFreq, uTime / (uFreq * 50.0 * anim));// * (1000 + smoothstep(uFreq, uTime, uDeltaFreq));

	p *= 2.0;
	p += rz(p) * rz(-q) / uFreq;

	if (r < 1.0)
	{
		col = vec3(0.0, 0.3, 0.4) * wiggle(q, uFreq);

		float f = fbm(5.0 * p);
		col = mix(col, vec3(0.2, 0.5, 0.4), f);

		f = 1.0 - smoothstep(0.2, 0.5, r);
		col = mix(col, vec3(0.9, 0.6, 0.2), f);

		a += 0.05 * fbm(20.0 * p);

		f = smoothstep(0.3, 1.0, fbm(vec2(6.0 * r, 20.0 * a)));
		col = mix(col, vec3(1.0), f);

		//f = smoothstep(0.4, 0.9, fbm(vec2(25.0 * uFreq, 15.0 * a + (uTime / 10.0 * uFreq))));
		f = smoothstep(0.4, 0.9, fbm(vec2(25.0 * r + (uTime + uFreq), 15.0 * a) * m));
		//col *= 1.0 - 0.5 * f;
		col *= wiggle(col.xy, 1.0 - 0.5 * f);

		f = smoothstep(0.6, 0.8, r);
		col *= 1.0 - 0.5 * f;

		f = smoothstep(0.2, 0.25, r);
		col *= f;

		f =1.0 -  smoothstep(0.0, 0.5, length(p - vec2(0.24, 0.2)));
		col += vec3(1.0, 0.9, 0.8) * f * 0.9;

		f = smoothstep(0.75, 0.8, r);
		col = mix(col, vec3(1.0), f);
	}

	return col;// + smoothstep(uFreq, uTime, abs(uDeltaFreq - uDeltaTime));
}

void main()
{
	vec2 uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) * 2.0;

	vec4 ret = vec4(eye(uv), 1.0);

	retColor = ret;
}
